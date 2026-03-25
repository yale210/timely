import { useRef, useEffect, useState } from "react"

/**
 * Observes a DOM element and returns true once it enters the viewport.
 * Disconnects after the first intersection so the animation only plays once.
 * @param threshold - Fraction of the element that must be visible to trigger (0–1).
 * @returns A tuple of [ref, visible] to attach to the target element.
 */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, visible] as const
}

export default useReveal
