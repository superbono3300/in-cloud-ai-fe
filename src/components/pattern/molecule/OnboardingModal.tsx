import { useEffect } from 'react'
import './OnboardingModal.css'

type OnboardingModalProps = {
  open: boolean
  onClose: () => void
  onStart: () => void
}

export function OnboardingModal({ open, onClose, onStart }: OnboardingModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="onboarding-overlay" role="presentation" onClick={onClose}>
      <div
        className="onboarding-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="onboarding-badge">Welcome</div>
        <h2 id="onboarding-title">빠르게 시작하는 방법</h2>
        <p id="onboarding-desc" className="onboarding-lead">
          질문을 바로 입력하거나 예시 프롬프트를 불러와 대화를 시작할 수 있습니다.
          이미지도 함께 첨부해서 더 정확한 답변을 받을 수 있어요.
        </p>

        <div className="onboarding-grid">
          <section className="onboarding-card">
            <span className="onboarding-card-title">무엇을 할 수 있나요?</span>
            <ul>
              <li>요약, 단계별 가이드, 코드 리뷰, 회의록 정리</li>
              <li>질문/답변 검색 및 대화 이어보기</li>
              <li>답변 복사, 재생성, 이미지 첨부</li>
            </ul>
          </section>

          <section className="onboarding-card">
            <span className="onboarding-card-title">예시 프롬프트</span>
            <ul>
              <li>“아래 내용을 3줄로 요약해줘”</li>
              <li>“이 코드의 문제를 우선순위로 정리해줘”</li>
              <li>“회의 메모를 TODO 중심으로 정리해줘”</li>
            </ul>
          </section>

          <section className="onboarding-card">
            <span className="onboarding-card-title">이미지 첨부</span>
            <ul>
              <li>드래그하거나 클릭해서 첨부할 수 있습니다.</li>
              <li>스크린샷, UI 캡처, 문서 이미지를 함께 보내보세요.</li>
              <li>한 번에 여러 장을 첨부할 수 있습니다.</li>
            </ul>
          </section>
        </div>

        <div className="onboarding-actions">
          <button type="button" className="onboarding-secondary" onClick={onClose}>
            다음에 보기
          </button>
          <button type="button" className="onboarding-primary" onClick={onStart}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  )
}