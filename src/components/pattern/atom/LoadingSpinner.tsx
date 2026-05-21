import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import './LoadingSpinner.css'

export function LoadingSpinner() {
  const loadingText = 'AI가 응답을 생성하고 있습니다...'
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let animation: ReturnType<typeof lottie.loadAnimation> | null = null
    let disposed = false

    fetch('/lottie/Ghostsmart_.json')
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
        // Keep layout stable if JSON fails to load.
      })

    return () => {
      disposed = true
      if (animation) {
        animation.destroy()
      }
    }
  }, [])

  return (
    <div className="spinner-wrapper" aria-label="응답 생성 중">
      <div ref={containerRef} className="spinner-lottie" aria-hidden="true" />
      <span className="spinner-text" aria-live="polite">
        {Array.from(loadingText).map((char, index) => (
          <span
            key={`${char}-${index}`}
            className="spinner-text-char"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </div>
  )
}
