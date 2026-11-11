import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import type { DemoValues } from '../lib/heroDemo.ts'
import { storyDetails } from '../lib/storyNames.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import CountUp from './CountUp.tsx'
import './SeeItStory.css'

// The real invitation, shared with the hero (same lazy chunk).
const DemoCard = lazy(() => import('./DemoCard.tsx'))

type Details = ReturnType<typeof storyDetails>

const STEPS = [
  {
    title: 'Share one link',
    body: 'Drop it in the family group, your church group, the office chat. No guest list to upload and nothing to download.',
  },
  {
    title: 'Guests reply in a minute',
    body: 'They open your invitation, tap accept or decline, and they’re done. No account, and they can change their answer later.',
  },
  {
    title: 'Watch the replies roll in',
    body: 'Every reply lands as it happens, with the running count and which side of the family it came through.',
  },
  {
    title: 'Gifts, if you want them',
    body: 'After replying, guests can send cash straight to your bank account, buy aso-ebi, or chip in for something on your wishlist.',
  },
] as const

function Check() {
  return (
    <svg className="st-check" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r="24" />
      <path d="M15 27l7 7 15-16" />
    </svg>
  )
}

function Confetti() {
  return (
    <span className="st-confetti" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => <i key={i} />)}
    </span>
  )
}

/* ── The four screens ────────────────────────────────────────────── */

function ShareScreen({ d }: { d: Details }) {
  return (
    <div className="st-app st-chat">
      <header className="st-chat-head">
        <span className="st-avatar st-avatar--group">FG</span>
        <span>
          <span className="st-chat-title">Family group</span>
          <span className="st-chat-sub">Aunty Bisi, Tolu, Dayo and 24 others</span>
        </span>
      </header>
      <div className="st-chat-body">
        <div className="st-msg st-msg--out st-pop">
          <div className="st-preview">
            <div className="st-preview-card">
              <span className="st-preview-eyebrow">Together with their families</span>
              <span className="st-preview-names">{d.one}<em>&amp;</em>{d.two}</span>
              <span className="st-preview-rule" />
            </div>
            <span className="st-preview-title">{d.one} &amp; {d.two}</span>
            <span className="st-preview-sub">You’re invited · {d.shortDate}</span>
            <span className="st-preview-link">…/invite/{d.slug}</span>
          </div>
          <span className="st-ticks">✓✓</span>
          <span className="st-reaction">❤️ 6</span>
        </div>
        <div className="st-typing"><i /><i /><i /></div>
        <div className="st-msg st-msg--in st-pop st-pop--2"><b>Tolu</b>Congratulations!! 🎉🎉</div>
        <div className="st-msg st-msg--in st-pop st-pop--3"><b>Aunty Bisi</b>Opened it. So beautiful 😍 We are coming!</div>
      </div>
    </div>
  )
}

function ReplyScreen({ d, values, id }: { d: Details; values: DemoValues; id: string }) {
  return (
    <div className="st-app st-guest">
      <div className="st-guest-scroll">
        <Suspense fallback={null}>
          <DemoCard values={values} idPrefix={`${id}-card`} />
        </Suspense>
      </div>
      <div className="st-sheet">
        <span className="st-sheet-grip" />
        <p className="st-sheet-title">Will you be joining us?</p>
        <div className="st-input"><span className="st-typed">Amaka Obi</span><span className="st-caret" /></div>
        <div className="st-btn st-btn--accept">Joyfully accepting<span className="st-ripple" /></div>
        <div className="st-btn">Regretfully declining</div>
        <div className="st-done">
          <Check />
          <p>See you there, Amaka</p>
          <span className="st-done-sub">{d.one} &amp; {d.two} will see your reply</span>
          <Confetti />
        </div>
      </div>
    </div>
  )
}

const FEED = [
  { name: 'Ifeoma Eze', reply: 'Accepted', side: 'Bride’s side', when: 'now', yes: true },
  { name: 'Tunde Bakare', reply: 'Declined', side: 'Groom’s side', when: '2m', yes: false },
  { name: 'Amaka Obi', reply: 'Accepted', side: 'Bride’s side', when: '4m', yes: true },
]

function BoardScreen({ d, on }: { d: Details; on: boolean }) {
  return (
    <div className="st-app st-board">
      <header className="st-board-head">
        <span className="st-avatar">{d.initials}</span>
        <span>
          <span className="st-board-title">{d.one} &amp; {d.two}</span>
          <span className="st-board-sub">In {d.days} days</span>
        </span>
      </header>
      <div className="st-stats">
        <div className="st-stat st-stat--main"><CountUp to={84} on={on} /><span>Accepted</span></div>
        <div className="st-stat"><CountUp to={9} on={on} /><span>Declined</span></div>
        <div className="st-stat"><CountUp to={31} on={on} /><span>Waiting</span></div>
      </div>
      <div className="st-split">
        <span className="st-split-a" />
        <span className="st-split-b" />
      </div>
      <div className="st-split-legend"><span>Bride’s side 51</span><span>Groom’s side 33</span></div>
      <p className="st-feed-label">Latest replies</p>
      <ul className="st-feed">
        {FEED.map((r) => (
          <li key={r.name}>
            <span className={r.yes ? 'st-avatar st-avatar--yes' : 'st-avatar st-avatar--no'}>
              {r.name.split(' ').map((p) => p[0]).join('')}
            </span>
            <span className="st-feed-text">
              <span>{r.name}</span>
              <span className="st-feed-sub">{r.reply} · {r.side}</span>
            </span>
            <span className="st-feed-when">{r.when}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

function GiftScreen({ d, on }: { d: Details; on: boolean }) {
  return (
    <div className="st-app st-gift">
      <p className="st-gift-eyebrow">Send a gift to</p>
      <p className="st-gift-names">{d.one} &amp; {d.two}</p>
      <div className="st-amounts">
        <span>₦10,000</span>
        <span>₦25,000</span>
        <span>₦50,000</span>
        <i className="st-amount-pick" />
      </div>
      <div className="st-btn st-btn--pay">Send ₦25,000<span className="st-ripple" /></div>
      <div className="st-gift-sent"><Check /><span>Gift sent. Thank you!</span></div>
      <div className="st-gift-row">
        <span className="st-swatch" />
        <span className="st-feed-text"><span>Aso-ebi</span><span className="st-feed-sub">2 sets · paid</span></span>
      </div>
      <div className="st-gift-row">
        <span className="st-kettle">☕</span>
        <span className="st-feed-text">
          <span>Electric kettle</span>
          <span className="st-fund"><i /></span>
          <span className="st-feed-sub st-funded">Fully funded 🎉</span>
        </span>
      </div>
      <div className="st-total">
        <span className="st-total-label">Gifts received so far</span>
        <span className="st-total-amount"><CountUp to={385000} on={on} format={naira} /></span>
        <span className="st-total-sub">From 22 guests · paid to your bank</span>
      </div>
    </div>
  )
}

function Phone({ children, on }: { children: ReactNode; on: boolean }) {
  return (
    <div className={on ? 'st-phone is-on' : 'st-phone'} aria-hidden="true">
      <span className="st-island" />
      <div className="st-status"><span>9:41</span><span className="st-status-icons"><i /><i /><i /></span></div>
      <div className="st-screen">{children}</div>
    </div>
  )
}

// Little cards that fly out around the phone on wide screens.
const CHIPS: string[][] = [
  ['✓✓ Family group', '✓✓ Church friends', '✓✓ Office'],
  ['No app. No account.', 'Replied in 38 seconds'],
  ['+1 Accepted · Bride’s side', '+1 Accepted · Groom’s side', '−1 Declined'],
  ['₦25,000 received', 'Kettle fully funded', 'Aso-ebi · 2 sets paid'],
]

/**
 * "See it in action": four steps scroll past while one phone stays in view, tilting and swapping
 * its screen as each step reaches the middle of the window. Each screen plays its own little
 * sequence when it comes on. On phones every step carries its own phone. The visitor's names,
 * date and design from the hero carry through. Reduced motion shows each finished screen.
 */
export default function SeeItStory({ values }: { values: DemoValues }) {
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])
  const wide = useMediaQuery('(min-width: 56rem)')
  const d = storyDetails(values)

  // The active step is the one whose middle is nearest the middle of the window; the rail
  // fills with how far through the steps the reader is.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const middle = window.innerHeight / 2
      let nearest = 0
      let best = Infinity
      stepRefs.current.forEach((el, i) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const distance = Math.abs(rect.top + rect.height / 2 - middle)
        if (distance < best) {
          best = distance
          nearest = i
        }
      })
      setActive(nearest)
      const first = stepRefs.current[0]?.getBoundingClientRect()
      const last = stepRefs.current[STEPS.length - 1]?.getBoundingClientRect()
      if (first && last && rootRef.current) {
        const progress = (middle - first.top) / Math.max(1, last.bottom - first.top)
        rootRef.current.style.setProperty('--progress', String(Math.min(1, Math.max(0, progress))))
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [])

  const screen = (i: number, on: boolean, id: string) =>
    [
      <ShareScreen key="s" d={d} />,
      <ReplyScreen key="r" d={d} values={values} id={id} />,
      <BoardScreen key="b" d={d} on={on} />,
      <GiftScreen key="g" d={d} on={on} />,
    ][i]

  return (
    <section className="landing-section story-section" aria-labelledby="story-title">
      <div className="section-head">
        <h2 id="story-title">See it in action</h2>
        <p className="muted">
          {d.typed
            ? `Follow ${d.one} & ${d.two}’s invitation from the first message to the last gift.`
            : 'Follow one invitation from the first message to the last gift. Type your names at the top and it becomes yours.'}
        </p>
      </div>

      <div ref={rootRef} className="story" data-step={active}>
        <ol className="story-steps">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              ref={(el) => { stepRefs.current[i] = el }}
              className={i === active ? 'story-step is-active' : 'story-step'}
            >
              <span className="story-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {!wide && (
                <div className="story-inline">
                  <Phone on={i === active}>{screen(i, i === active, `story-m${i}`)}</Phone>
                </div>
              )}
            </li>
          ))}
        </ol>

        {wide && (
          <div className="story-stage">
            <div className="story-sticky">
              <div className="story-glow" aria-hidden="true">
                {STEPS.map((_, i) => <span key={i} className={i === active ? 'is-on' : undefined} />)}
              </div>
              <div className="story-device">
                {STEPS.map((_, i) => (
                  <div key={i} className={i === active ? 'story-layer is-active' : 'story-layer'}>
                    <Phone on={i === active}>{screen(i, i === active, `story-d${i}`)}</Phone>
                    <div className="story-chips" aria-hidden="true">
                      {CHIPS[i]!.map((chip) => <span key={chip} className="story-chip">{chip}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
