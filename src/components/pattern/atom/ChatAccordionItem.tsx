import { useState } from 'react'
import './ChatAccordionItem.css'
import { MarkdownAnswer } from './MarkdownAnswer'

type ChatAccordionItemProps = {
  index: number
  question: string
  answer: string | null
  status?: 'stopped' | 'completed'
  defaultOpen?: boolean
  onDelete?: () => void
  onResume?: () => void
  resumeDisabled?: boolean
  isPinned?: boolean
  onTogglePin?: () => void
  rating?: 'up' | 'down'
  onRate?: (value: 'up' | 'down') => void
  onRegenerate?: () => void
  regenerateDisabled?: boolean
  responseTime?: string
}

export function ChatAccordionItem({
  index,
  question,
  answer,
  status,
  defaultOpen = false,
  onDelete,
  onResume,
  resumeDisabled = false,
  onRate,
  onRegenerate,
  regenerateDisabled = false,
  responseTime,
}: ChatAccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const canQuickResume = status === 'stopped' && Boolean(onResume)
  const hasStatusBadge = status === 'completed' || canQuickResume
  const hasActions = Boolean(onDelete || hasStatusBadge)

  return (
    <div className={`accordion-item ${open ? 'open' : ''}`}>
      <div className="accordion-header">
        <button
          type="button"
          className="accordion-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <span className="accordion-index">Q{index}</span>
          <span className="accordion-question">{question}</span>
        </button>

        {hasActions && (
          <div className="accordion-actions">
            {canQuickResume && (
              <span
                role="button"
                tabIndex={resumeDisabled ? -1 : 0}
                className={`accordion-status-badge stopped accordion-status-action ${resumeDisabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (!resumeDisabled && onResume) {
                    onResume()
                  }
                }}
                onKeyDown={(event) => {
                  if (resumeDisabled || !onResume) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onResume()
                  }
                }}
                aria-disabled={resumeDisabled}
                aria-label={resumeDisabled ? '요청중' : '중지된 답변 재개'}
                title={resumeDisabled ? '요청중' : '클릭하여 재개'}
              >
                {resumeDisabled ? '요청중' : '중지함'}
              </span>
            )}
            {status === 'completed' && !canQuickResume && (
              <span className="accordion-status-badge completed">답변완료</span>
            )}
            {onDelete && (
              <button
                type="button"
                className="accordion-delete-btn"
                onClick={onDelete}
                title="삭제"
                aria-label="대화 삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            )}
            <button
              type="button"
              className="accordion-toggle-btn"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? '접기' : '펼치기'}
              title={open ? '접기' : '펼치기'}
            >
              <span className="accordion-icon">{open ? '▲' : '▼'}</span>
            </button>
          </div>
        )}

        {!hasActions && (
          <button
            type="button"
            className="accordion-toggle-btn"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? '접기' : '펼치기'}
            title={open ? '접기' : '펼치기'}
          >
            <span className="accordion-icon">{open ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {open && (
        <div className="accordion-body">
          <div className="accordion-user">
            <span className="accordion-label user-label">사용자</span>
            <p>{question}</p>
          </div>
          {answer && (
            <div className="accordion-assistant">
              <div className="accordion-assistant-head">
                <span className="accordion-label ai-label">AI</span>
                {responseTime && <span className="accordion-response-time">{responseTime}</span>}
              </div>
              <MarkdownAnswer content={answer} />
              {(onRate || onRegenerate) && (
                <div className="accordion-assistant-actions">
                  {/* {onRate && (
                    <>
                      <button
                        type="button"
                        className={`assistant-action-btn ${rating === 'up' ? 'active' : ''}`}
                        onClick={() => onRate('up')}
                        aria-label="답변 좋아요"
                        title="좋아요"
                      >
                        👍 좋아요
                      </button>
                      <button
                        type="button"
                        className={`assistant-action-btn ${rating === 'down' ? 'active' : ''}`}
                        onClick={() => onRate('down')}
                        aria-label="답변 별로예요"
                        title="별로예요"
                      >
                        👎 별로예요
                      </button>
                    </>
                  )} */}
                  {onRegenerate && (
                    <button
                      type="button"
                      className="assistant-action-btn regenerate"
                      onClick={onRegenerate}
                      disabled={regenerateDisabled}
                      aria-label="답변 재생성"
                      title="답변 재생성"
                    >
                      재생성
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
