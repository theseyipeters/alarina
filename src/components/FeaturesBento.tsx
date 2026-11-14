import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { DemoValues } from '../lib/heroDemo.ts'
import { SAMPLE } from '../lib/heroDemo.ts'
import { storyDetails } from '../lib/storyNames.ts'
import CountUp from './CountUp.tsx'
import './FeaturesBento.css'

type Details = ReturnType<typeof storyDetails>

/* ── Tile visuals ──────────────────────────────────────────────────── */

function TwoCursors({ d }: { d: Details }) {
  return (
    <div className="fb-doc">
      <div className="fb-row fb-row--a"><span>Venue</span><span className="fb-typed fb-typed--a">The Garden Hall, Lagos</span></div>
      <div className="fb-row fb-row--b"><span>Colours</span><span className="fb-typed fb-typed--b">Emerald and gold</span></div>
      <div className="fb-row"><span>Dress code</span><span className="fb-muted">Aso-ebi, gold gele</span></div>
      <span className="fb-cursor fb-cursor--a"><i /><b>{d.one}</b></span>
      <span className="fb-cursor fb-cursor--b"><i /><b>{d.two}</b></span>
    </div>
  )
}

function NoAccounts() {
  return (
    <div className="fb-nope">
      <span>Download an app</span>
      <span>Create an account</span>
      <span>Remember a password</span>
      <span className="fb-yes">✓ Tap the link, reply, done</span>
    </div>
  )
}

function Donut({ on }: { on: boolean }) {
  return (
    <div className="fb-donut">
      <svg viewBox="0 0 120 120">
        <circle className="fb-ring fb-ring--track" cx="60" cy="60" r="48" />
        <circle className="fb-ring fb-ring--wait" cx="60" cy="60" r="48" pathLength="100" />
        <circle className="fb-ring fb-ring--no" cx="60" cy="60" r="48" pathLength="100" />
        <circle className="fb-ring fb-ring--yes" cx="60" cy="60" r="48" pathLength="100" />
      </svg>
      <span className="fb-donut-centre"><CountUp to={84} on={on} delay={300} /><small>coming</small></span>
      <ul className="fb-legend">
        <li><i className="fb-dot fb-dot--yes" />Accepted 84</li>
        <li><i className="fb-dot fb-dot--wait" />Waiting 31</li>
        <li><i className="fb-dot fb-dot--no" />Declined 9</li>
      </ul>
    </div>
  )
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

function BankCard({ on }: { on: boolean }) {
  return (
    <div className="fb-bank">
      <ul className="fb-drops">
        <li>+₦5,000 · Dayo</li>
        <li>+₦25,000 · Ifeoma</li>
        <li>+₦10,000 · Amaka</li>
      </ul>
      <div className="fb-card">
        <span className="fb-card-label">Your bank account ••••4821</span>
        <span className="fb-card-amount"><CountUp to={40000} on={on} format={naira} delay={1400} /></span>
        <span className="fb-card-sub">Paid through Paystack</span>
      </div>
    </div>
  )
}

function Padlock() {
  return (
    <div className="fb-lock">
      <svg viewBox="0 0 48 56" aria-hidden="true">
        <path className="fb-shackle" d="M14 26 V16 a10 10 0 0 1 20 0 V26" />
        <rect x="6" y="24" width="36" height="28" rx="6" />
        <circle cx="24" cy="38" r="3.5" />
      </svg>
      <div className="fb-toggle"><span className="fb-knob" /></div>
      <span className="fb-lock-label"><span>Only you two can see it</span><span>Live for your guests</span></span>
    </div>
  )
}

/** Splits a name into characters, keeping a letter and its tone mark together. */
function graphemes(text: string) {
  if ('Segmenter' in Intl) return Array.from(new Intl.Segmenter().segment(text), (s) => s.segment)
  return Array.from(text)
}

const plain = (ch: string) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '')

function NameMarks({ d }: { d: Details }) {
  // A name with no marks has nothing to show, so fall back to the sample.
  const name = graphemes(d.one).some((ch) => plain(ch) !== ch) ? d.one : SAMPLE.one
  let k = 0
  const letters = graphemes(name).map((ch, i) => {
    const marked = plain(ch) !== ch
    const style = marked ? ({ '--d': `${0.9 + k++ * 0.55}s` } as CSSProperties) : undefined
    return marked ? (
      <span key={i} className="fb-letter fb-letter--marked" style={style}>
        <span className="fb-plain">{plain(ch)}</span>
        <span className="fb-marked">{ch}</span>
      </span>
    ) : (
      <span key={i} className="fb-letter">{ch}</span>
    )
  })
  const keys = graphemes(name).filter((ch) => plain(ch) !== ch)
  return (
    <div className="fb-names">
      <p className="fb-name">{letters}</p>
      <div className="fb-keys">
        {keys.map((ch, i) => (
          <span key={i} className="fb-key" style={{ '--d': `${0.9 + i * 0.55}s` } as CSSProperties}>{ch}</span>
        ))}
      </div>
    </div>
  )
}

/* ── The grid ──────────────────────────────────────────────────────── */

type Tile = { title: string; body: string; wide?: 'two' | 'full'; visual: (d: Details, on: boolean) => ReactNode }

const TILES: Tile[] = [
  {
    title: 'Planned by two',
    body: 'You and your partner share one wedding space, with the same access to everything. Edit at the same time; nothing gets lost.',
    wide: 'two',
    visual: (d) => <TwoCursors d={d} />,
  },
  {
    title: 'No accounts for guests',
    body: 'Guests open the link, read the details and reply. Nothing to download, nothing to sign up for.',
    visual: () => <NoAccounts />,
  },
  {
    title: 'Know who’s coming',
    body: 'See who has accepted and declined, and which side of the family each reply came through.',
    visual: (_, on) => <Donut on={on} />,
  },
  {
    title: 'Cash gifts, simply',
    body: 'After replying, guests can send a gift. It goes straight to your Nigerian bank account through Paystack.',
    visual: (_, on) => <BankCard on={on} />,
  },
  {
    title: 'Private until you publish',
    body: 'Your invitation stays hidden until you publish it, and guest details are visible only to the two of you.',
    visual: () => <Padlock />,
  },
  {
    title: 'Names spelt right',
    body: 'Ọláolúwa, not Olaoluwa. Tap the keys for Yoruba letters and tone marks, and every accent and under-dot shows exactly as you type it.',
    wide: 'full',
    visual: (d) => <NameMarks d={d} />,
  },
]

/**
 * "Everything in one place": a bento grid where every tile has a small live picture that plays
 * as it scrolls into view and again each time it comes back. Uses the names typed in the hero.
 * Reduced motion shows each finished picture.
 */
export default function FeaturesBento({ values }: { values: DemoValues }) {
  const d = storyDetails(values)
  const refs = useRef<(HTMLLIElement | null)[]>([])
  // Without IntersectionObserver every tile simply plays on load.
  const [on, setOn] = useState<boolean[]>(() => TILES.map(() => !('IntersectionObserver' in window)))

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) =>
        setOn((prev) => {
          const nextOn = [...prev]
          for (const entry of entries) nextOn[refs.current.indexOf(entry.target as HTMLLIElement)] = entry.isIntersecting
          return nextOn
        }),
      { threshold: 0.4 },
    )
    refs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="landing-section" aria-labelledby="features-title">
      <div className="section-head">
        <h2 id="features-title">Everything in one place</h2>
        <p className="muted">No more spreadsheets, scattered WhatsApp replies or guessing who’s coming.</p>
      </div>
      <ul className="fb-grid">
        {TILES.map((tile, i) => (
          <li
            key={tile.title}
            ref={(el) => { refs.current[i] = el }}
            className={['fb-tile', tile.wide && `fb-tile--${tile.wide}`, on[i] && 'is-on'].filter(Boolean).join(' ')}
          >
            <div className="fb-visual" aria-hidden="true">{tile.visual(d, Boolean(on[i]))}</div>
            <div className="fb-copy">
              <h3>{tile.title}</h3>
              <p className="muted">{tile.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
