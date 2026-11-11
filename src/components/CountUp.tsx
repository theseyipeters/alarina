import { useEffect, useRef } from 'react'

/**
 * A number that counts up from zero each time `on` turns true. Writes to the DOM rather than
 * state, so it doesn't re-render the page sixty times a second. Reduced motion shows the total.
 */
export default function CountUp({
  to,
  on,
  format = String,
  delay = 500,
}: {
  to: number
  on: boolean
  format?: (n: number) => string
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!on || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(to)
      return
    }
    let frame = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 1600))
      el.textContent = format(Math.round(to * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, on, format, delay])
  return <span ref={ref}>{format(to)}</span>
}
