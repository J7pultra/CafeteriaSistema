import { useEffect, useState } from 'react'

/**
 * Animates a numeric value smoothly using requestAnimationFrame.
 * Returns the exact target immediately during automated tests to avoid timing flakes.
 */
export function useCountUp(target: number, durationMs = 550): number {
  const isTestEnv = import.meta.env.MODE === 'test'
  const [displayValue, setDisplayValue] = useState<number>(() => (isTestEnv ? target : 0))

  useEffect(() => {
    if (isTestEnv) return
    if (target === 0) {
      setDisplayValue(0)
      return
    }

    let frameId: number
    const startTime = performance.now()
    const startVal = 0

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(startVal + (target - startVal) * eased)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        setDisplayValue(target)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [target, durationMs, isTestEnv])

  return isTestEnv ? target : displayValue
}

export default useCountUp
