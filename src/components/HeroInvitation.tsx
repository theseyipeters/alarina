import { useEffect, useRef, useState } from 'react'
import '@fontsource/instrument-serif'
import '@fontsource/instrument-serif/400-italic.css'
import './HeroInvitation.css'

const REPLIES = [
  { name: 'Amaka', reply: 'joyfully accepts', attending: true },
  { name: 'Tunde', reply: 'regretfully declines', attending: false },
  { name: 'Ifeoma', reply: 'joyfully accepts', attending: true },
]

type Props = {
  /** The couple shown on the card; defaults to the sample couple used on sign-in and sign-up. */
  one?: string
  two?: string
  date?: string
  venue?: string
}

/**
 * Envelope illustration (sign-in, sign-up and the landing page's closing band): an envelope opens, the invitation rises out, and replies arrive,
 * then the scene plays back in reverse and repeats. Pure CSS motion; with reduced motion it
 * shows the finished scene without moving.
 */
export default function HeroInvitation({
  one = 'Ọláolúwa',
  two = 'Ẹniọlá',
  date = 'Saturday, 11 December 2027',
  venue = 'Eko Hotel, Lagos',
}: Props = {}) {
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
      aria-label={`An emerald envelope opens and a wedding invitation for ${one} and ${two} rises out, as guest replies arrive.`}
    >
      <div className="envelope" aria-hidden="true">
        <div className="envelope-back" />

        <div className="envelope-flap">
          <span className="envelope-seal">{one[0]}{two[0]}</span>
        </div>

        <div className="letter">
          <div className="letter-card">
            <p className="letter-eyebrow">Together with their families</p>
            <p className="letter-names">
              {one} <span className="letter-amp">&amp;</span> {two}
            </p>
            <span className="letter-rule" />
            <p className="letter-details">{date}</p>
            <p className="letter-details">{venue}</p>
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
