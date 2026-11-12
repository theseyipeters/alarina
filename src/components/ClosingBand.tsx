import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SAMPLE, type DemoValues } from '../lib/heroDemo.ts'
import { formatDate } from '../lib/format.ts'
import { storyDetails } from '../lib/storyNames.ts'
import { Petals } from './Celebration.tsx'
import HeroInvitation from './HeroInvitation.tsx'
import './ClosingBand.css'

/**
 * The landing page's finale: the emerald "live" panel with drifting petals, the copy rising in,
 * and the envelope opening on the visitor's own names from the hero. Plays as it scrolls into
 * view; reduced motion shows it still.
 */
export default function ClosingBand({ values, cta }: { values: DemoValues; cta: ReactNode }) {
  const d = storyDetails(values)
  const ref = useRef<HTMLElement>(null)
  // Without IntersectionObserver it simply shows.
  const [on, setOn] = useState(() => !('IntersectionObserver' in window))

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setOn(Boolean(entry?.isIntersecting)), { threshold: 0.35 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className={on ? 'celebrate finale is-on' : 'celebrate finale'} aria-labelledby="cta-title">
      <Petals />
      <div className="finale-copy">
        <p className="finale-eyebrow">Your turn</p>
        <h2 id="cta-title">
          <span>Ready</span> <span>when</span> <span>you</span> <span>are</span>
        </h2>
        <p className="finale-lead">
          {d.typed
            ? `${d.one} & ${d.two}, your invitation is one sitting away. Invite each other, make it yours, and publish when it feels right.`
            : 'Start tonight, invite your partner, and publish when it feels right.'}
        </p>
        <div className="finale-cta">{cta}</div>
        <p className="finale-note">Private until you publish. Guests never need an account.</p>
      </div>
      <div className="finale-art">
        <HeroInvitation
          one={d.one}
          two={d.two}
          date={formatDate(values.date || SAMPLE.date)}
          venue="The Garden Hall, Lagos"
        />
      </div>
    </section>
  )
}
