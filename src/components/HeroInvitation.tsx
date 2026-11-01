import { useEffect, useRef, useState } from 'react'
import '@fontsource/instrument-serif'
import '@fontsource/instrument-serif/400-italic.css'
import './HeroInvitation.css'

const REPLIES = [
  { name: 'Amaka', reply: 'joyfully accepts', attending: true },
  { name: 'Tunde', reply: 'regretfully declines', attending: false },
  { name: 'Ifeoma', reply: 'joyfully accepts', attending: true },
]

/**
 * Landing-page illustration: an envelope opens, the invitation rises out, and replies arrive,
 * then the scene plays back in reverse and repeats. Pure CSS motion; with reduced motion it
 * shows the finished scene without moving.
 */
export default function HeroInvitation() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  // The loop runs only while the scene is on screen: it waits below the fold on phones,
  // and pauses when scrolled away so it isn't animating unseen.
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.4,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={inView ? 'hero-art is-playing' : 'hero-art'}
      role="img"
      aria-label="An emerald envelope opens and a wedding invitation for Ọláolúwa and Ẹniọlá rises out, as guest replies arrive."
    >
      <div className="envelope" aria-hidden="true">
        <div className="envelope-back" />

        <div className="envelope-flap">
          <span className="envelope-seal">ỌẸ</span>
        </div>

        <div className="letter">
          <div className="letter-card">
            <p className="letter-eyebrow">Together with their families</p>
            <p className="letter-names">
              Ọláolúwa <span className="letter-amp">&amp;</span> Ẹniọlá
            </p>
            <span className="letter-rule" />
            <p className="letter-details">Saturday, 11 December 2027</p>
            <p className="letter-details">Eko Hotel, Lagos</p>
          </div>
        </div>

        <div className="envelope-pocket">
          <span className="fold fold--left" />
          <span className="fold fold--right" />
          <span className="fold fold--bottom" />
        </div>
      </div>

      <ul className="replies" aria-hidden="true">
        {REPLIES.map((r) => (
          <li key={r.name} className={r.attending ? 'reply reply--yes' : 'reply'}>
            <svg className="reply-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d={r.attending ? 'M5 12.5l4.5 4.5L19 7.5' : 'M7 7l10 10M17 7L7 17'} />
            </svg>
            {r.name} {r.reply}
          </li>
        ))}
      </ul>
    </div>
  )
}
