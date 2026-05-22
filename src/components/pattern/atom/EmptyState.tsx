import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

export function EmptyState() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let animation: ReturnType<typeof lottie.loadAnimation> | null = null
    let disposed = false

    fetch('/lottie/Empty-Search.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load Lottie JSON')
        }
        return response.json()
      })
      .then((json) => {
        if (disposed || !containerRef.current) return

        animation = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: json,
        })
      })
      .catch(() => {
        // Keep text-only empty state if animation fails to load.
      })

    return () => {
      disposed = true
      if (animation) {
        animation.destroy()
      }
    }
  }, [])

  return (
    <div className="empty" role="status" aria-live="polite">
      <div ref={containerRef} className="empty-lottie" aria-hidden="true" />
      <p className="empty-text">아직 대화가 없습니다. 질문을 입력하고 전송해보세요.</p>
    </div>
  )
}
