import { useState, useCallback, useMemo, useRef } from 'react'
import axios from 'axios'
import type { ChatMessage, ChatApiModel, UseChatOptions, UseChatReturn } from '@type'

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
          'Authorization': `Bearer ${model.apiKey}`,
          ...model.headers,
        },
      }),
    [model.apiBase, model.apiKey, model.headers],
  )

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || loading) return

      const baseMessages: ChatMessage[] = []
      if (memoizedOptions?.systemPrompt?.trim()) {
        baseMessages.push({ role: 'system', content: memoizedOptions.systemPrompt.trim() })
      }

      setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
      setError('')
      setStopped(false)
      setLoading(true)

      const controller = new AbortController()
      controllerRef.current = controller

      try {
        const response = await axiosInstance.post('/chat/completions', {
          model: model.model,
          messages: [...baseMessages, ...messages, { role: 'user', content: userMessage }],
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
    [axiosInstance, loading, messages, model.model, memoizedOptions],
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
    stopGeneration,
    clearMessages,
    setMessages,
    deletePair,
  }
}
