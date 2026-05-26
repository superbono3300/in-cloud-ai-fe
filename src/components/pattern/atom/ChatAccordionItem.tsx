import { useEffect, useState } from 'react'
import './ChatAccordionItem.css'
import { MarkdownAnswer } from './MarkdownAnswer'

type ChatAccordionItemProps = {
  domId?: string
  index: number
  question: string
  answer: string | null
  userImageUrls?: string[]
  status?: 'stopped' | 'completed'
  defaultOpen?: boolean
  onDelete?: () => void
  onResume?: () => void
  resumeDisabled?: boolean
  resumeLoading?: boolean
  isPinned?: boolean
  onTogglePin?: () => void
  rating?: 'up' | 'down'
  onRate?: (value: 'up' | 'down') => void
  onRegenerate?: () => void
  regenerateDisabled?: boolean
  regenerateLoading?: boolean
  responseTime?: string
  onPreviewImage?: (url: string) => void
}

export function ChatAccordionItem({
  domId,
  index,
  question,
  answer,
  userImageUrls = [],
  status,
  defaultOpen = false,
  onDelete,
  onResume,
  resumeDisabled = false,
  resumeLoading = false,
  onRate,
  onRegenerate,
  regenerateDisabled = false,
  regenerateLoading = false,
  responseTime,
  onPreviewImage,
}: ChatAccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  // 재생성 중에는 항상 카드가 펼쳐진 상태로 표시
  const isOpen = open || regenerateLoading
  const canQuickResume = status === 'stopped' && Boolean(onResume)
  const hasStatusBadge = status === 'completed' || canQuickResume
  const hasActions = Boolean(onDelete || hasStatusBadge)

  useEffect(() => {
    if (!copied) return

    const timer = window.setTimeout(() => {
      setCopied(false)
    }, 1800)

    return () => {
      window.clearTimeout(timer)
    }
  }, [copied])

  const handleCopyAnswer = async () => {
    if (!answer) return

    try {
      await navigator.clipboard.writeText(answer)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div id={domId} className={`accordion-item ${isOpen ? 'open' : ''} ${regenerateLoading ? 'regenerating' : ''}`}>
      {regenerateLoading && (
        <div className="accordion-regenerating-overlay" aria-hidden="true">
          <span className="accordion-regenerating-chip">
            <span className="regenerate-spinner" />
            이 카드 재생성 중
          </span>
        </div>
      )}

      <div className="accordion-header">
        <button
          type="button"
          className="accordion-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={isOpen}
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
                aria-label={resumeLoading ? '요청중' : '중지된 답변 재개'}
                title={resumeLoading ? '요청중' : '클릭하여 재개'}
              >
                {resumeLoading ? '요청중' : '중지함'}
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
              aria-label={isOpen ? '접기' : '펼치기'}
              title={isOpen ? '접기' : '펼치기'}
            >
              <span className="accordion-icon">{isOpen ? '▲' : '▼'}</span>
            </button>
          </div>
        )}

        {!hasActions && (
          <button
            type="button"
            className="accordion-toggle-btn"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={isOpen ? '접기' : '펼치기'}
            title={isOpen ? '접기' : '펼치기'}
          >
            <span className="accordion-icon">{isOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="accordion-body">
          <div className="accordion-user">
            <span className="accordion-label user-label">사용자</span>
            {question && <p>{question}</p>}
            {userImageUrls.length > 0 && (
              <div className="accordion-user-images-wrap">
                {userImageUrls.length > 1 && (
                  <p className="accordion-user-images-hint">좌우 스와이프로 이미지를 확인하세요 ({userImageUrls.length}장)</p>
                )}
                <div className="accordion-user-images" aria-label="첨부 이미지">
                  {userImageUrls.map((url, imageIndex) => (
                    <figure className="accordion-user-image-slide" key={`${url.slice(0, 48)}-${imageIndex}`}>
                      <button
                        type="button"
                        className="accordion-user-image-button"
                        onClick={() => onPreviewImage?.(url)}
                        aria-label={`첨부 이미지 ${imageIndex + 1} 미리보기`}
                        title="이미지 미리보기"
                      >
                        <img
                          src={url}
                          alt={`첨부 이미지 ${imageIndex + 1}`}
                          className="accordion-user-image"
                          loading="lazy"
                        />
                      </button>
                      {userImageUrls.length > 1 && (
                        <figcaption className="accordion-user-image-index">
                          {imageIndex + 1}/{userImageUrls.length}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </div>
          {regenerateLoading ? (
            <div className="accordion-assistant accordion-regen-loading">
              <div className="accordion-assistant-head">
                <span className="accordion-label ai-label">AI</span>
                <span className="accordion-regen-badge">
                  <span className="regenerate-spinner" aria-hidden="true" />
                  답변 재생성 중...
                </span>
              </div>
              <div className="regen-skeleton">
                <div className="regen-skeleton-line" style={{ width: '88%' }} />
                <div className="regen-skeleton-line" style={{ width: '72%' }} />
                <div className="regen-skeleton-line" style={{ width: '80%' }} />
                <div className="regen-skeleton-line" style={{ width: '60%' }} />
              </div>
            </div>
          ) : (
            answer && (
              <div className="accordion-assistant">
              <div className="accordion-assistant-head">
                <span className="accordion-label ai-label">AI</span>
                {responseTime && <span className="accordion-response-time">{responseTime}</span>}
              </div>
              <MarkdownAnswer content={answer} />
              {(onRate || onRegenerate || answer) && (
                <div className="accordion-assistant-actions">
                  <button
                    type="button"
                    className={`assistant-action-btn copy ${copied ? 'active' : ''}`}
                    onClick={handleCopyAnswer}
                    aria-label="답변 복사"
                    title="답변 복사"
                    disabled={!answer}
                  >
                    {copied ? '복사됨' : '복사'}
                  </button>
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
                      className={`assistant-action-btn regenerate ${regenerateLoading ? 'loading' : ''}`}
                      onClick={onRegenerate}
                      disabled={regenerateDisabled}
                      aria-label={regenerateLoading ? '요청중' : '답변 재생성'}
                      title={regenerateLoading ? '요청중' : '답변 재생성'}
                    >
                      {regenerateLoading ? (
                        <>
                          <span className="regenerate-spinner" aria-hidden="true" />
                          요청중
                        </>
                      ) : (
                        '재생성'
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
