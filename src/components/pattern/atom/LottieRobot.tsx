import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

type LottieRobotProps = {
  size?: number
}

export default function LottieRobot({ size = 48 }: LottieRobotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let animation: ReturnType<typeof lottie.loadAnimation> | null = null
    let disposed = false

    fetch('/lottie/robot_.json')
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
        // Keep empty placeholder when JSON fails to load.
      })

    return () => {
      disposed = true
      if (animation) {
        animation.destroy()
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: size, height: size }} aria-hidden="true" />
}
