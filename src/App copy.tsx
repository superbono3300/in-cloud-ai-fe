import { useMemo, useState } from 'react'
import type { FormEventHandler } from 'react'
import './App.css'
import { MODELS } from './config/models'

type ChatRole = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

function App() {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0)
  const [systemPrompt, setSystemPrompt] = useState('당신은 아이엔소프트 AI 도우미입니다.')
  const [input, setInput] = useState('간단한 React 컴포넌트 예제를 보여줘.')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedModel = MODELS[selectedModelIndex]
  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    const userMessage = input.trim()
    if (!userMessage || loading) return

    const baseMessages: ChatMessage[] = []
    if (systemPrompt.trim()) {
      baseMessages.push({ role: 'system', content: systemPrompt.trim() })
    }

    const nextMessages = [...messages, { role: 'user', content: userMessage }]

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${selectedModel.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${selectedModel.apiKey}`,
          ...selectedModel.headers,
        },
        body: JSON.stringify({
          model: selectedModel.model,
          messages: [...baseMessages, ...nextMessages],
        }),
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(detail || 'Gateway 응답 오류')
      }

      const data: { choices?: { message?: { content?: string } }[] } = await response.json()
      const assistantMessage = data.choices?.[0]?.message?.content?.trim()
      if (!assistantMessage) {
        throw new Error('응답 본문이 비어 있습니다.')
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }])
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 처리 중 알 수 없는 오류가 발생했습니다.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>IN Cloud AI Gateway</h1>
      </header>

      <form className="chat-form" onSubmit={handleSubmit}>
        <div className="grid-row">
          <label>
            모델
            <select
              value={selectedModelIndex}
              onChange={(event) => setSelectedModelIndex(Number(event.target.value))}
            >
              {MODELS.map((m, i) => (
                <option key={m.model} value={i}>{m.name}</option>
              ))}
            </select>
          </label>
          <label>
            시스템 프롬프트
            <input
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="챗봇의 동작 방식을 지정합니다"
            />
          </label>
        </div>

        <label>
          사용자 메시지
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            placeholder="질문을 입력하세요"
          />
        </label>

        <button type="submit" disabled={!canSend}>
          {loading ? '생성 중...' : '전송'}
        </button>
      </form>

 

      {error ? (
        <><p className="error">오류: {error}</p></>
      ) : (
        <>
      <section className="chat-list" aria-live="polite">
        {messages.length === 0 && (
          <p className="empty">아직 대화가 없습니다. 질문을 입력하고 전송해보세요.</p>
        )}
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`chat-item ${message.role}`}>
            <h2>{message.role === 'user' ? '사용자' : message.role === 'assistant' ? 'AI' : '시스템'}</h2>
            <p>{message.content}</p>
          </article>
        ))}
      </section>
      </>
      )}


    </main>
  )
}

export default App
