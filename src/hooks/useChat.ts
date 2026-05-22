import { useState, useCallback, useMemo, useRef } from 'react'
import axios from 'axios'
import type { ChatMessage, ChatApiModel, UseChatOptions, UseChatReturn } from '@type'

type ChatCompletionContentPart =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'image_url'
      image_url: {
        url: string
      }
    }

type ChatCompletionRequestMessage = {
  role: ChatMessage['role']
  content: string | ChatCompletionContentPart[]
}

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'))
    reader.readAsDataURL(file)
  })
}

export function useChat(model: ChatApiModel, options?: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(options?.initialMessages || [])
  const [loading, setLoading] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [error, setError] = useState('')
  const controllerRef = useRef<AbortController | null>(null)

  const memoizedOptions = useMemo(() => options, [options])

  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: model.apiBase,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': model.apiKey,
          ...model.headers,
        },
      }),
    [model.apiBase, model.apiKey, model.headers],
  )

  const buildBaseMessages = useCallback((): ChatMessage[] => {
    if (memoizedOptions?.systemPrompt?.trim()) {
      return [{ role: 'system', content: memoizedOptions.systemPrompt.trim() }]
    }
    return []
  }, [memoizedOptions])

  const sendMessage = useCallback(
    async (userMessage: string, images: File[] = []) => {
      const normalizedMessage = userMessage.trim()
      if ((!normalizedMessage && images.length === 0) || loading) return

      const baseMessages = buildBaseMessages()
      const displayMessage = normalizedMessage || '(이미지 첨부)'

      setMessages((prev) => [...prev, { role: 'user', content: displayMessage }])
      setError('')
      setStopped(false)
      setLoading(true)

      const controller = new AbortController()
      controllerRef.current = controller

      try {
        const validImages = images.filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type))
        const imageDataUrls = await Promise.all(validImages.map(fileToDataUrl))

        const userContent: string | ChatCompletionContentPart[] =
          imageDataUrls.length === 0
            ? normalizedMessage
            : [
                ...(normalizedMessage
                  ? [
                      {
                        type: 'text' as const,
                        text: normalizedMessage,
                      },
                    ]
                  : []),
                ...imageDataUrls.map((url) => ({
                  type: 'image_url' as const,
                  image_url: { url },
                })),
              ]

        const requestMessages: ChatCompletionRequestMessage[] = [
          ...baseMessages,
          ...messages,
          { role: 'user', content: userContent },
        ]

        const requestPayload = {
          model: model.model,
          stream: false,
          messages: requestMessages,
        }

        if (import.meta.env.DEV) {
          console.info('[IN Cloud AI Gateway] chat payload', requestPayload)
        }

        const response = await axiosInstance.post('/chat/completions', {
          ...requestPayload,
        }, {
          signal: controller.signal,
        })

        const assistantMessage = response.data?.choices?.[0]?.message?.content?.trim()
        if (!assistantMessage) {
          throw new Error('응답 본문이 비어 있습니다.')
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }])
        setStopped(false)
      } catch (err) {
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
          setStopped(true)
          setError('')
          return
        }

        setStopped(false)
        const errorMessage = err instanceof Error ? err.message : '요청 처리 중 알 수 없는 오류가 발생했습니다.'
        setError(errorMessage)
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
        setLoading(false)
      }
    },
    [axiosInstance, buildBaseMessages, loading, messages, model.model],
  )

  const resumePair = useCallback(
    async (pairIndex: number): Promise<boolean> => {
      if (loading) return false

      let targetUserMessageIndex = -1
      let currentPairIndex = 0
      for (let i = 0; i < messages.length; i++) {
        if (messages[i].role !== 'user') continue

        if (currentPairIndex === pairIndex) {
          targetUserMessageIndex = i
          break
        }
        currentPairIndex += 1
      }

      if (targetUserMessageIndex < 0) return false

      const targetUserMessage = messages[targetUserMessageIndex]
      if (!targetUserMessage?.content.trim()) return false

      setError('')
      setStopped(false)
      setLoading(true)

      const controller = new AbortController()
      controllerRef.current = controller

      try {
        const requestMessages = [
          ...buildBaseMessages(),
          ...messages.slice(0, targetUserMessageIndex + 1),
        ]

        const response = await axiosInstance.post('/chat/completions', {
          model: model.model,
          stream: false,
          messages: requestMessages,
        }, {
          signal: controller.signal,
        })

        const assistantMessage = response.data?.choices?.[0]?.message?.content?.trim()
        if (!assistantMessage) {
          throw new Error('응답 본문이 비어 있습니다.')
        }

        setMessages((prev) => {
          let userIndex = -1
          let pairCount = 0

          for (let i = 0; i < prev.length; i++) {
            if (prev[i].role !== 'user') continue

            if (pairCount === pairIndex) {
              userIndex = i
              break
            }
            pairCount += 1
          }

          if (userIndex < 0) return prev

          const hasAssistant = prev[userIndex + 1]?.role === 'assistant'
          if (hasAssistant) {
            return [
              ...prev.slice(0, userIndex + 1),
              { role: 'assistant', content: assistantMessage },
              ...prev.slice(userIndex + 2),
            ]
          }

          return [
            ...prev.slice(0, userIndex + 1),
            { role: 'assistant', content: assistantMessage },
            ...prev.slice(userIndex + 1),
          ]
        })

        setStopped(false)
        return true
      } catch (err) {
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
          setStopped(true)
          setError('')
          return false
        }

        setStopped(false)
        const errorMessage = err instanceof Error ? err.message : '요청 처리 중 알 수 없는 오류가 발생했습니다.'
        setError(errorMessage)
        return false
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
        setLoading(false)
      }
    },
    [axiosInstance, buildBaseMessages, loading, messages, model.model],
  )

  const stopGeneration = useCallback(() => {
    if (!controllerRef.current) return

    controllerRef.current.abort()
    controllerRef.current = null
    setStopped(true)
    setLoading(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setStopped(false)
    setError('')
  }, [])

  const deletePair = useCallback((pairIndex: number) => {
    setMessages((prev) => {
      let count = 0
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].role === 'user') {
          if (count === pairIndex) {
            const hasAssistant = prev[i + 1]?.role === 'assistant'
            return [...prev.slice(0, i), ...prev.slice(i + (hasAssistant ? 2 : 1))]
          }
          count++
        }
      }
      return prev
    })
  }, [])

  return {
    messages,
    loading,
    stopped,
    error,
    sendMessage,
    resumePair,
    stopGeneration,
    clearMessages,
    setMessages,
    deletePair,
  }
}
