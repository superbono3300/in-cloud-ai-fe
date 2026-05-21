import { useEffect, useMemo, useState } from 'react'
import type { FormEventHandler } from 'react'
import '../App.css'
import { MODELS } from '../config/models'
import { useChat } from '../hooks'
import type { ChatMessage } from '../hooks'
import { ModelSelector } from '../components/pattern/atom/ModelSelector'
import { MessageInput } from '../components/pattern/atom/MessageInput'
import { SubmitButton } from '../components/pattern/atom/SubmitButton'
import { ErrorMessage } from '../components/pattern/atom/ErrorMessage'
import { EmptyState } from '../components/pattern/atom/EmptyState'
import { LoadingSpinner } from '../components/pattern/atom/LoadingSpinner'
import { ChatAccordionItem } from '../components/pattern/atom/ChatAccordionItem'
import { ConfirmDialog } from '../components/pattern/molecule/ConfirmDialog'
import LottieRobot from '../components/pattern/atom/LottieRobot'

type QAPair = {
  question: string
  answer: string | null
}

function groupMessages(messages: ChatMessage[]): QAPair[] {
  const pairs: QAPair[] = []
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const next = messages[i + 1]
      pairs.push({
        question: messages[i].content,
        answer: next?.role === 'assistant' ? next.content : null,
      })
      if (next?.role === 'assistant') i++
    }
  }
  return pairs
}

export function ChatPage() {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0)
  const [systemPrompt] = useState('당신은 아이엔소프트 AI 도우미입니다.')
  const [input, setInput] = useState('간단한 React 컴포넌트 예제를 보여줘.')
  const [stoppedPairIndexes, setStoppedPairIndexes] = useState<number[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)

  const selectedModel = MODELS[selectedModelIndex]
  const { messages, loading, error, sendMessage, stopGeneration, deletePair } = useChat(selectedModel, { systemPrompt })
  const canSend = useMemo(() => input.trim().length > 0, [input])
  const pairs = useMemo(() => groupMessages(messages), [messages])

  const handleStop = () => {
    if (!loading) return

    const currentPairIndex = pairs.length - 1
    if (currentPairIndex >= 0) {
      setStoppedPairIndexes((prev) => (
        prev.includes(currentPairIndex) ? prev : [...prev, currentPairIndex]
      ))
    }

    stopGeneration()
  }

  const handleStopClick = () => {
    if (!loading) return
    setShowStopConfirm(true)
  }

  const handleStopCancel = () => {
    setShowStopConfirm(false)
  }

  const handleStopConfirm = () => {
    setShowStopConfirm(false)
    handleStop()
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    const userMessage = input.trim()
    if (!userMessage || loading) return

    await sendMessage(userMessage)
    setInput('')
  }

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 240)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-title-row">
          <LottieRobot size={68} />
          <h1>IN Cloud AI Gateway</h1>
        </div>
        {/* <p>빠르고 안정적인 사내 AI 질의 도우미</p> */}
      </header>

      <form className="chat-form" onSubmit={handleSubmit}>
        <div className="grid-row">
          <ModelSelector
            value={selectedModelIndex}
            onChange={setSelectedModelIndex}
            models={MODELS}
          />
          {/* <SystemPromptInput
            value={systemPrompt}
            onChange={setSystemPrompt}
          /> */}
        </div>

        <MessageInput
          value={input}
          onChange={setInput}
        />

        <SubmitButton disabled={!canSend} loading={loading} onStop={handleStopClick} />
      </form>

      {error && <ErrorMessage message={error} />}

      <section className="chat-list" aria-live="polite">
        {loading && <LoadingSpinner />}
        {pairs.length === 0 && !loading && <EmptyState />}

        {[...pairs].reverse().map((pair, reversedIndex) => {
          const originalIndex = pairs.length - 1 - reversedIndex
          return (
            <ChatAccordionItem
              key={originalIndex}
              index={originalIndex + 1}
              question={pair.question}
              answer={pair.answer}
              status={
                pair.answer
                  ? 'completed'
                  : stoppedPairIndexes.includes(originalIndex)
                    ? 'stopped'
                    : undefined
              }
              defaultOpen={originalIndex === pairs.length - 1}
              onDelete={() => {
                deletePair(originalIndex)
                setStoppedPairIndexes((prev) =>
                  prev.filter((i) => i !== originalIndex).map((i) => (i > originalIndex ? i - 1 : i))
                )
              }}
            />
          )
        })}
      </section>

      <button
        type="button"
        className={`scroll-top-button ${showScrollTop ? 'visible' : ''}`}
        onClick={handleScrollTop}
        aria-label="맨 위로 이동"
      >
        ↑
      </button>

      <ConfirmDialog
        open={showStopConfirm}
        title="답변 생성을 중지할까요?"
        description="중지하면 현재 생성 중인 답변을 끝까지 받지 못할 수 있습니다."
        confirmText="중지"
        cancelText="계속 생성"
        onConfirm={handleStopConfirm}
        onCancel={handleStopCancel}
      />
    </main>
  )
}
