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
import { ImageAttachment } from '../components/pattern/molecule/ImageAttachment'
import { ImagePreviewModal } from '../components/pattern/molecule/ImagePreviewModal'
import LottieRobot from '../components/pattern/atom/LottieRobot'

type QAPair = {
  question: string
  answer: string | null
}

type PairRating = 'up' | 'down'

const PROMPT_PRESETS = [
  {
    id: 'summary',
    label: '요약형',
    text: '아래 내용을 핵심만 5줄 이내로 요약해줘. 마지막에 실행 가능한 액션 아이템 3개도 제시해줘.',
  },
  {
    id: 'steps',
    label: '단계별 가이드',
    text: '초급자도 이해할 수 있게 단계별로 설명해줘. 각 단계마다 예시를 1개씩 포함해줘.',
  },
  {
    id: 'code-review',
    label: '코드 리뷰',
    text: '아래 코드의 문제점과 개선안을 우선순위로 정리해줘. 성능, 가독성, 안정성 관점으로 나눠서 답해줘.',
  },
  {
    id: 'meeting-note',
    label: '회의록 정리',
    text: '아래 메모를 회의록 형식으로 정리해줘. 결정사항, TODO, 담당자, 일정 항목을 분리해서 작성해줘.',
  },
] as const

// function escapeHtml(value: string): string {
//   return value
//     .replaceAll('&', '&amp;')
//     .replaceAll('<', '&lt;')
//     .replaceAll('>', '&gt;')
//     .replaceAll('"', '&quot;')
//     .replaceAll("'", '&#39;')
// }

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

function formatResponseTime(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yy}.${mm}.${dd} ${hh}:${min}:${ss}`
}

export function ChatPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [selectedModelIndex, setSelectedModelIndex] = useState(0)
  const [systemPrompt] = useState('당신은 아이엔소프트 AI 도우미입니다.')
  const [input, setInput] = useState('간단한 React 컴포넌트 예제를 보여줘.')
  const [stoppedPairIndexes, setStoppedPairIndexes] = useState<number[]>([])
  const [pinnedPairIndexes, setPinnedPairIndexes] = useState<number[]>([])
  const [ratings, setRatings] = useState<Record<number, PairRating>>({})
  const [responseTimes, setResponseTimes] = useState<Record<number, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState<(typeof PROMPT_PRESETS)[number]['id']>(PROMPT_PRESETS[0].id)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  // 이미지 첨부 및 미리보기 상태
  const [attachedImages, setAttachedImages] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const selectedModel = MODELS[selectedModelIndex]
  const { messages, loading, error, sendMessage, resumePair, stopGeneration, deletePair } = useChat(selectedModel, { systemPrompt })
  const canSend = useMemo(
    () => input.trim().length > 0 || attachedImages.length > 0,
    [attachedImages.length, input],
  )
  const pairs = useMemo(() => groupMessages(messages), [messages])
  const visiblePairs = useMemo(() => {
    const pinnedSet = new Set(pinnedPairIndexes)
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filtered = [...pairs]
      .map((pair, pairIndex) => ({ ...pair, pairIndex }))
      .reverse()
      .filter((pair) => {
        if (!normalizedQuery) return true

        return (
          pair.question.toLowerCase().includes(normalizedQuery) ||
          pair.answer?.toLowerCase().includes(normalizedQuery)
        )
      })

    return filtered.sort((a, b) => Number(pinnedSet.has(b.pairIndex)) - Number(pinnedSet.has(a.pairIndex)))
  }, [pairs, pinnedPairIndexes, searchQuery])

  const buildMarkdownExport = (): string => {
    const lines: string[] = ['# IN Cloud AI Gateway Export', '']

    pairs.forEach((pair, pairIndex) => {
      const badges: string[] = []
      if (pinnedPairIndexes.includes(pairIndex)) badges.push('PINNED')
      if (ratings[pairIndex] === 'up') badges.push('좋아요')
      if (ratings[pairIndex] === 'down') badges.push('별로예요')

      lines.push(`## Q${pairIndex + 1}${badges.length > 0 ? ` [${badges.join(', ')}]` : ''}`)
      lines.push('')
      lines.push('### 사용자')
      lines.push(pair.question)
      lines.push('')
      lines.push('### AI')
      lines.push(pair.answer ?? '(답변 없음 또는 중지됨)')
      lines.push('')
    })

    return lines.join('\n')
  }

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
    if ((!userMessage && attachedImages.length === 0) || loading) return
    const targetPairIndex = pairs.length
    const sent = await sendMessage(userMessage, attachedImages)
    if (!sent) return

    setResponseTimes((prev) => ({
      ...prev,
      [targetPairIndex]: formatResponseTime(),
    }))
    setInput('')
    setAttachedImages([])
  }

  const handleApplyPreset = () => {
    const preset = PROMPT_PRESETS.find((item) => item.id === selectedPresetId)
    if (!preset) return
    setInput(preset.text)
  }

  const handleResume = async (pairIndex: number) => {
    if (loading) return

    const resumed = await resumePair(pairIndex)
    if (!resumed) return

    setStoppedPairIndexes((prev) => prev.filter((i) => i !== pairIndex))
    setResponseTimes((prev) => ({
      ...prev,
      [pairIndex]: formatResponseTime(),
    }))
  }

  const handleRegenerate = async (pairIndex: number) => {
    if (loading) return

    const regenerated = await resumePair(pairIndex)
    if (!regenerated) return

    setStoppedPairIndexes((prev) => prev.filter((i) => i !== pairIndex))
    setResponseTimes((prev) => ({
      ...prev,
      [pairIndex]: formatResponseTime(),
    }))
  }

  const handleDeletePair = (pairIndex: number) => {
    deletePair(pairIndex)

    setStoppedPairIndexes((prev) =>
      prev.filter((i) => i !== pairIndex).map((i) => (i > pairIndex ? i - 1 : i)),
    )

    setPinnedPairIndexes((prev) =>
      prev.filter((i) => i !== pairIndex).map((i) => (i > pairIndex ? i - 1 : i)),
    )

    setRatings((prev) => {
      const next: Record<number, PairRating> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const index = Number(key)
        if (index === pairIndex) return
        next[index > pairIndex ? index - 1 : index] = value
      })
      return next
    })

    setResponseTimes((prev) => {
      const next: Record<number, string> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const index = Number(key)
        if (index === pairIndex) return
        next[index > pairIndex ? index - 1 : index] = value
      })
      return next
    })
  }

  const handleTogglePin = (pairIndex: number) => {
    setPinnedPairIndexes((prev) =>
      prev.includes(pairIndex) ? prev.filter((i) => i !== pairIndex) : [...prev, pairIndex],
    )
  }

  const handleRate = (pairIndex: number, value: PairRating) => {
    setRatings((prev) => {
      if (prev[pairIndex] === value) {
        const next = { ...prev }
        delete next[pairIndex]
        return next
      }

      return {
        ...prev,
        [pairIndex]: value,
      }
    })
  }

  const handleExportMarkdown = () => {
    const blob = new Blob([buildMarkdownExport()], { type: 'text/markdown;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // const handleExportPdf = () => {
  //   const printableHtml = pairs
  //     .map((pair, pairIndex) => {
  //       const ratingLabel = ratings[pairIndex] === 'up' ? '좋아요' : ratings[pairIndex] === 'down' ? '별로예요' : ''
  //       const pinLabel = pinnedPairIndexes.includes(pairIndex) ? 'PIN' : ''
  //       const metaLabel = [pinLabel, ratingLabel].filter(Boolean).join(' · ')

  //       return `
  //         <section style="margin-bottom:20px; page-break-inside: avoid;">
  //           <h2 style="font-size:18px; margin:0 0 8px;">Q${pairIndex + 1}${metaLabel ? ` (${metaLabel})` : ''}</h2>
  //           <h3 style="font-size:14px; margin:0 0 6px;">사용자</h3>
  //           <p style="white-space:pre-wrap; margin:0 0 10px;">${escapeHtml(pair.question)}</p>
  //           <h3 style="font-size:14px; margin:0 0 6px;">AI</h3>
  //           <p style="white-space:pre-wrap; margin:0;">${escapeHtml(pair.answer ?? '(답변 없음 또는 중지됨)')}</p>
  //         </section>
  //       `
  //     })
  //     .join('')

  //   const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=800')
  //   if (!printWindow) return

  //   printWindow.document.write(`
  //     <!doctype html>
  //     <html lang="ko">
  //       <head>
  //         <meta charset="utf-8" />
  //         <title>Chat Export</title>
  //       </head>
  //       <body style="font-family:'NanumSquare','Noto Sans KR',sans-serif; color:#0f172a; padding:24px;">
  //         <h1 style="margin-top:0;">IN Cloud AI Gateway Export</h1>
  //         ${printableHtml}
  //       </body>
  //     </html>
  //   `)
  //   printWindow.document.close()
  //   printWindow.focus()
  //   printWindow.print()
  // }

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

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-top-row">
          <div className="app-header-title-row">
            <LottieRobot size={68} />
            <h1>IN Cloud AI Gateway</h1>
          </div>
          <button
            type="button"
            className="theme-toggle-button"
            onClick={handleThemeToggle}
            aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
            title={theme === 'light' ? '다크 모드' : '라이트 모드'}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? '다크 모드' : '라이트 모드'}</span>
          </button>
        </div>
        {/* <p>빠르고 안정적인 사내 AI 질의 도우미</p> */}
      </header>

      <form className="chat-form" onSubmit={handleSubmit}>
        <div>
          <ModelSelector
            value={selectedModelIndex}
            onChange={setSelectedModelIndex}
            models={MODELS}
          />
        </div>

        <MessageInput
          value={input}
          onChange={setInput}
        />

        <div className="prompt-preset-row">
          <select
            value={selectedPresetId}
            onChange={(event) => setSelectedPresetId(event.target.value as (typeof PROMPT_PRESETS)[number]['id'])}
            aria-label="프롬프트 프리셋 선택"
          >
            {PROMPT_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
          <button type="button" className="form-secondary-btn" onClick={handleApplyPreset}>
            프리셋 적용
          </button>
        </div>

        {/* 이미지 첨부 UI */}
        <ImageAttachment
          files={attachedImages}
          onFilesChange={setAttachedImages}
          onPreview={setPreviewUrl}
        />

        <SubmitButton disabled={!canSend} loading={loading} onStop={handleStopClick} />
      </form>

      {error && <ErrorMessage message={error} />}

      <div className="chat-tools-row">
        <input
          type="search"
          className="chat-search-input"
          placeholder="질문/답변 검색"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="대화 검색"
        />
        <div className="chat-export-actions">
          <button type="button" className="form-secondary-btn" onClick={handleExportMarkdown}>
            Markdown 내보내기
          </button>
          {/* <button type="button" className="form-secondary-btn" onClick={handleExportPdf}>
            PDF 저장
          </button> */}
        </div>
      </div>

      <section className="chat-list" aria-live="polite">
        {loading && <LoadingSpinner />}
        {pairs.length === 0 && !loading && <EmptyState />}
        {pairs.length > 0 && visiblePairs.length === 0 && (
          <p className="empty">검색 결과가 없습니다.</p>
        )}

        {visiblePairs.map((pair) => {
          const originalIndex = pair.pairIndex
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
              onDelete={() => handleDeletePair(originalIndex)}
              onResume={() => { void handleResume(originalIndex) }}
              resumeDisabled={loading}
              isPinned={pinnedPairIndexes.includes(originalIndex)}
              onTogglePin={() => handleTogglePin(originalIndex)}
              rating={ratings[originalIndex]}
              onRate={(value) => handleRate(originalIndex, value)}
              onRegenerate={() => { void handleRegenerate(originalIndex) }}
              regenerateDisabled={loading}
              responseTime={responseTimes[originalIndex]}
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

      {/* 이미지 미리보기 모달 */}
      <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </main>
  )
}
