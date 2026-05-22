import { useEffect, useMemo, useRef, useState } from 'react'
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
import { OnboardingModal } from '../components/pattern/molecule/OnboardingModal'
import { ImageAttachment } from '../components/pattern/molecule/ImageAttachment'
import { ImagePreviewModal } from '../components/pattern/molecule/ImagePreviewModal'
import LottieRobot from '../components/pattern/atom/LottieRobot'

type QAPair = {
  question: string
  answer: string | null
}

type PairRating = 'up' | 'down'

type PersistedChatState = {
  messages: ChatMessage[]
  selectedModelIndex: number
  stoppedPairIndexes: number[]
  pinnedPairIndexes: number[]
  ratings: Record<number, PairRating>
  responseTimes: Record<number, string>
  searchQuery: string
  selectedPresetId: (typeof PROMPT_PRESETS)[number]['id']
}

const CHAT_STATE_STORAGE_KEY = 'in-cloud-ai-gateway.chat-state.v1'
const ONBOARDING_STORAGE_KEY = 'in-cloud-ai-gateway.onboarding-seen.v1'

function isValidPresetId(value: string): value is (typeof PROMPT_PRESETS)[number]['id'] {
  return PROMPT_PRESETS.some((preset) => preset.id === value)
}

function loadPersistedChatState(): PersistedChatState | null {
  if (typeof window === 'undefined') return null

  try {
    const rawValue = window.localStorage.getItem(CHAT_STATE_STORAGE_KEY)
    if (!rawValue) return null

    const parsed = JSON.parse(rawValue) as Partial<PersistedChatState>
    if (!Array.isArray(parsed.messages)) return null

    return {
      messages: parsed.messages.filter(
        (message): message is ChatMessage =>
          message?.role !== undefined && typeof message.content === 'string',
      ),
      selectedModelIndex: typeof parsed.selectedModelIndex === 'number' ? parsed.selectedModelIndex : 0,
      stoppedPairIndexes: Array.isArray(parsed.stoppedPairIndexes) ? parsed.stoppedPairIndexes.filter((value) => typeof value === 'number') : [],
      pinnedPairIndexes: Array.isArray(parsed.pinnedPairIndexes) ? parsed.pinnedPairIndexes.filter((value) => typeof value === 'number') : [],
      ratings: parsed.ratings && typeof parsed.ratings === 'object' ? parsed.ratings : {},
      responseTimes: parsed.responseTimes && typeof parsed.responseTimes === 'object' ? parsed.responseTimes : {},
      searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
      selectedPresetId:
        typeof parsed.selectedPresetId === 'string' && isValidPresetId(parsed.selectedPresetId)
          ? parsed.selectedPresetId
          : PROMPT_PRESETS[0].id,
    }
  } catch {
    return null
  }
}

function savePersistedChatState(state: PersistedChatState): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(CHAT_STATE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage write failures.
  }
}

function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true

  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1'
}

function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
  } catch {
    // Ignore storage write failures.
  }
}

const PROMPT_PRESETS = [
  {
    id: 'direct',
    label: '직접입력',
    text: '',
  },
  {
    id: 'summary',
    label: '요약형',
    text: `아래 내용을 실무 보고용으로 정리해줘.

[출력 형식]
1. 핵심 결론 (3줄)
2. 핵심 근거/수치 (최대 5개)
3. 리스크/이슈 (최대 3개)
4. 액션 아이템 표 (우선순위, 담당자, 마감일)

[작성 원칙]
- 정보가 없으면 추정하지 말고 "확인 필요"로 표시`,
  },
  {
    id: 'steps',
    label: '단계별 가이드',
    text: `아래 주제를 실제 실행 가능한 작업 가이드로 작성해줘.

[출력 순서]
1. 사전 준비물 (권한/도구/입력 데이터)
2. 단계별 절차
   - 목표
   - 작업 내용
   - 완료 기준
3. 실패 시 점검 포인트
4. 최종 검증 체크리스트

[작성 원칙]
- 각 단계는 체크박스 형식으로 작성`,
  },
  {
    id: 'code-review',
    label: '코드 리뷰',
    text: `아래 코드를 실무 코드리뷰 형식으로 검토해줘.

[이슈 분류]
- P0 / P1 / P2 우선순위로 구분

[각 이슈에 포함할 항목]
- 문제 설명
- 영향도
- 재현 조건
- 수정 제안 (필요 시 코드 예시)
- 테스트 포인트

[마무리]
- 즉시 수정 3개
- 추후 개선 3개`,
  },
  {
    id: 'meeting-note',
    label: '회의록 정리',
    text: `아래 메모를 팀 공유용 회의록으로 정리해줘.

[섹션 순서]
1. 회의 목적
2. 참석자
3. 핵심 논의
4. 결정사항
5. 미결 이슈
6. TODO (담당자/마감일/우선순위)
7. 다음 회의 안건

[추가]
- 불명확한 내용은 마지막에 "추가 확인 질문"으로 분리`,
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
  const [persistedChatState] = useState<PersistedChatState | null>(() => loadPersistedChatState())
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding())
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [selectedModelIndex, setSelectedModelIndex] = useState(() => {
    const savedIndex = persistedChatState?.selectedModelIndex ?? 0
    return Math.min(Math.max(savedIndex, 0), MODELS.length - 1)
  })
  const [systemPrompt] = useState('당신은 아이엔소프트 AI 도우미입니다.')
  const [input, setInput] = useState('')
  const [stoppedPairIndexes, setStoppedPairIndexes] = useState<number[]>(() => persistedChatState?.stoppedPairIndexes ?? [])
  const [pinnedPairIndexes, setPinnedPairIndexes] = useState<number[]>(() => persistedChatState?.pinnedPairIndexes ?? [])
  const [ratings, setRatings] = useState<Record<number, PairRating>>(() => persistedChatState?.ratings ?? {})
  const [responseTimes, setResponseTimes] = useState<Record<number, string>>(() => persistedChatState?.responseTimes ?? {})
  const [searchQuery, setSearchQuery] = useState(() => persistedChatState?.searchQuery ?? '')
  const [selectedPresetId, setSelectedPresetId] = useState<(typeof PROMPT_PRESETS)[number]['id']>(
    () => persistedChatState?.selectedPresetId ?? PROMPT_PRESETS[0].id,
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarOpenSignal, setSidebarOpenSignal] = useState(0)
  const [sidebarTargetPairIndex, setSidebarTargetPairIndex] = useState<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeletePairIndex, setPendingDeletePairIndex] = useState<number | null>(null)
  // 이미지 첨부 및 미리보기 상태
  const [attachedImages, setAttachedImages] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null)

  const selectedModel = MODELS[selectedModelIndex]
  const { messages, loading, error, sendMessage, resumePair, stopGeneration, deletePair } = useChat(selectedModel, {
    systemPrompt,
    initialMessages: persistedChatState?.messages ?? [],
  })
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
  const sidebarPairs = useMemo(
    () => [...pairs].map((pair, pairIndex) => ({ ...pair, pairIndex })).reverse(),
    [pairs],
  )

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

    const nextInputValue = preset.id === 'direct' ? '' : preset.text
    setInput('')

    requestAnimationFrame(() => {
      setInput(nextInputValue)
    })
  }

  const handleCloseOnboarding = () => {
    markOnboardingSeen()
    setShowOnboarding(false)
  }

  const handleStartOnboarding = () => {
    markOnboardingSeen()
    setShowOnboarding(false)
  }

  useEffect(() => {
    savePersistedChatState({
      messages,
      selectedModelIndex,
      stoppedPairIndexes,
      pinnedPairIndexes,
      ratings,
      responseTimes,
      searchQuery,
      selectedPresetId,
    })
  }, [messages, pinnedPairIndexes, ratings, responseTimes, searchQuery, selectedModelIndex, selectedPresetId, stoppedPairIndexes])

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

    const targetPair = pairs[pairIndex]
    setInput(typeof targetPair?.question === 'string' ? targetPair.question : '')

    requestAnimationFrame(() => {
      messageInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      messageInputRef.current?.focus()
      const valueLength = messageInputRef.current?.value.length ?? 0
      messageInputRef.current?.setSelectionRange(valueLength, valueLength)
    })

    setRegeneratingIndex(pairIndex)
    try {
      const regenerated = await resumePair(pairIndex)
      if (!regenerated) return

      setStoppedPairIndexes((prev) => prev.filter((i) => i !== pairIndex))
      setResponseTimes((prev) => ({
        ...prev,
        [pairIndex]: formatResponseTime(),
      }))
    } finally {
      setRegeneratingIndex(null)
    }
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

  const handleDeleteClick = (pairIndex: number) => {
    setPendingDeletePairIndex(pairIndex)
    setShowDeleteConfirm(true)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setPendingDeletePairIndex(null)
  }

  const handleDeleteConfirm = () => {
    if (pendingDeletePairIndex === null) {
      handleDeleteCancel()
      return
    }

    handleDeletePair(pendingDeletePairIndex)
    handleDeleteCancel()
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

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const handleSidebarCompose = () => {
    setInput('')
    setSearchQuery('')
    setSelectedPresetId('direct')

    requestAnimationFrame(() => {
      messageInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      messageInputRef.current?.focus()
    })
  }

  const handleSidebarJump = (pairIndex: number) => {
    setSearchQuery('')
    setSidebarTargetPairIndex(pairIndex)
    setSidebarOpenSignal((prev) => prev + 1)

    requestAnimationFrame(() => {
      document.getElementById(`chat-card-${pairIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <main className={`app-shell ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <OnboardingModal
        open={showOnboarding}
        onClose={handleCloseOnboarding}
        onStart={handleStartOnboarding}
      />

      <div className="app-layout">
        <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`} aria-hidden={!isSidebarOpen}>
          <div className="app-sidebar-head">
            <div>
              <strong>대화 패널</strong>
              <p>{pairs.length}개의 질문 흐름</p>
            </div>
            <button
              type="button"
              className="app-sidebar-close"
              onClick={handleSidebarToggle}
              aria-label="사이드패널 닫기"
              title="사이드패널 닫기"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            className="app-sidebar-primary"
            onClick={handleSidebarCompose}
          >
            새 질문 작성
          </button>

          <label className="app-sidebar-search-block">
            <span>대화 검색</span>
            <input
              type="search"
              className="app-sidebar-search-input"
              placeholder="질문 키워드 찾기"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="app-sidebar-list">
            {sidebarPairs.length === 0 ? (
              <p className="app-sidebar-empty">아직 대화가 없습니다.</p>
            ) : (
              sidebarPairs.map((pair) => (
                <button
                  key={pair.pairIndex}
                  type="button"
                  className="app-sidebar-item"
                  onClick={() => handleSidebarJump(pair.pairIndex)}
                >
                  <span className="app-sidebar-item-index">Q{pair.pairIndex + 1}</span>
                  <span className="app-sidebar-item-text">{pair.question}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="app-main">

      <header className="app-header">
        <div className="app-header-top-row">
          <div className="app-header-title-row">
            <LottieRobot size={68} />
            <h1>IN Cloud AI Gateway</h1>
          </div>
          <div className="app-header-actions">
            <button
              type="button"
              className={`header-sidebar-button ${isSidebarOpen ? 'active' : ''}`}
              onClick={handleSidebarToggle}
              aria-label={isSidebarOpen ? '사이드패널 닫기' : '사이드패널 열기'}
              title={isSidebarOpen ? '사이드패널 닫기' : '사이드패널 열기'}
            >
              <span className="header-sidebar-icon" aria-hidden="true">☰</span>
              <span>대화 패널</span>
            </button>
            <button
              type="button"
              className="header-guide-button"
              onClick={() => setShowOnboarding(true)}
              aria-label="온보딩 가이드 보기"
              title="온보딩 가이드 보기"
            >
              <span className="header-guide-icon" aria-hidden="true">?</span>
              <span>가이드 보기</span>
            </button>
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
          textareaRef={messageInputRef}
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
              key={`${originalIndex}-${sidebarTargetPairIndex === originalIndex ? sidebarOpenSignal : 0}`}
              domId={`chat-card-${originalIndex}`}
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
              defaultOpen={originalIndex === pairs.length - 1 || sidebarTargetPairIndex === originalIndex}
              onDelete={() => handleDeleteClick(originalIndex)}
              onResume={() => { void handleResume(originalIndex) }}
              resumeDisabled={loading}
              isPinned={pinnedPairIndexes.includes(originalIndex)}
              onTogglePin={() => handleTogglePin(originalIndex)}
              rating={ratings[originalIndex]}
              onRate={(value) => handleRate(originalIndex, value)}
              onRegenerate={() => { void handleRegenerate(originalIndex) }}
              regenerateDisabled={loading}
              regenerateLoading={regeneratingIndex === originalIndex}
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

      <ConfirmDialog
        open={showDeleteConfirm}
        title="이 대화를 삭제할까요?"
        description="삭제하면 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* 이미지 미리보기 모달 */}
      <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        </div>
      </div>
    </main>
  )
}
