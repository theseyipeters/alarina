import { lazy, Suspense, useEffect, useRef, type PointerEvent } from 'react'
import type { useDemo } from '../lib/heroDemo.ts'
import './HeroStage.css'

// The real invitation pulls in the invitation fonts and styles, so it loads after the first paint.
const DemoCard = lazy(() => import('./DemoCard.tsx'))

const CHIPS = [
  { text: 'Amaka joyfully accepts', icon: '✓', tone: 'yes' },
  { text: '₦25,000 gift from Ifeoma', icon: '₦', tone: 'gift' },
  { text: 'Tunde regretfully declines', icon: '✕', tone: 'no' },
] as const

const AUTO_MS = 3800

const designKey = (v: { look: number; design: { template: string; palette: string } | null }) =>
  v.design ? `${v.design.template}-${v.design.palette}` : `look-${v.look}`

/**
 * The hero's live invitation: it flips in, floats over a drifting glow, leans towards the mouse,
 * and flips again each time the design changes. Until the visitor touches the form it steps
 * through designs on its own, only while on screen. Replies and gifts pop in around it.
 * Reduced motion keeps everything still and doesn't auto-cycle.
 */
export default function HeroStage({ demo }: { demo: ReturnType<typeof useDemo> }) {
  const ref = useRef<HTMLDivElement>(null)
  const auto = useRef(demo.autoShuffle)
  useEffect(() => {
    auto.current = demo.autoShuffle
  })

  useEffect(() => {
    const el = ref.current
    if (!el || demo.touched || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timer = 0
    const start = () => {
      window.clearInterval(timer)
      timer = window.setInterval(() => auto.current(), AUTO_MS)
    }
    const stop = () => window.clearInterval(timer)
    if (!('IntersectionObserver' in window)) {
      start()
      return stop
    }
    const observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()), { threshold: 0.3 })
    observer.observe(el)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [demo.touched])

  function lean(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    e.currentTarget.style.setProperty('--lean-y', `${(x * 10).toFixed(2)}deg`)
    e.currentTarget.style.setProperty('--lean-x', `${(-y * 8).toFixed(2)}deg`)
  }

  function rest(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.style.setProperty('--lean-y', '0deg')
    e.currentTarget.style.setProperty('--lean-x', '0deg')
  }

  return (
    <div ref={ref} className="hero-figure demo-stage hero-stage" onPointerMove={lean} onPointerLeave={rest}>
      <div className="hero-glow" aria-hidden="true"><span /><span /><span /></div>
      <div className="hero-float">
        <div className="hero-lean">
          {/* Remounts on each new design, so the card flips in again. */}
          <div key={designKey(demo.values)} className="hero-flip">
            <Suspense fallback={<div className="demo-stage-fallback" />}>
              <DemoCard values={demo.values} />
            </Suspense>
          </div>
        </div>
      </div>
      <ul className="hero-chips" aria-hidden="true">
        {CHIPS.map((chip) => (
          <li key={chip.text} className={`hero-chip hero-chip--${chip.tone}`}>
            <span className="hero-chip-icon">{chip.icon}</span>
            {chip.text}
          </li>
        ))}
      </ul>
      {!demo.touched && <p className="hero-hint" aria-hidden="true">Designs change by themselves until you type</p>}
    </div>
  )
}
