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
  // isPinned = false,
  onTogglePin,
  // rating,
  onRate,
  onRegenerate,
  regenerateDisabled = false,
  responseTime,
}: ChatAccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)

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
            {/* {onTogglePin && (
              <button
                type="button"
                className={`accordion-pin-btn ${isPinned ? 'active' : ''}`}
                onClick={onTogglePin}
                title={isPinned ? '핀 해제' : '핀 고정'}
                aria-label={isPinned ? '핀 해제' : '핀 고정'}
              >
                📌
              </button>
            )} */}
          {status && (
            <span className={`accordion-status-badge ${status}`}>
              {status === 'completed' ? '답변완료' : '중지함'}
            </span>
          )}
        </button>
        {(onDelete || onTogglePin || (status === 'stopped' && onResume)) && (
          <div className="accordion-actions">
            {status === 'stopped' && onResume && (
              <button
                type="button"
                className="accordion-resume-btn"
                onClick={onResume}
                disabled={resumeDisabled}
                title="중지된 답변 재개"
                aria-label="중지된 답변 재개"
              >
                재개
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
          </div>
        )}
        {!onDelete && !(status === 'stopped' && onResume) && (
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
