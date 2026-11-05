import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import CopyLink from '../components/CopyLink.tsx'
import UnlockCallout from '../components/UnlockCallout.tsx'
import Tour, { type TourStep } from '../components/Tour.tsx'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { coupleNames, daysUntil, formatDate, formatTime } from '../lib/format.ts'
import { namesInOrder } from '../invite/order.ts'
import { sideLabel } from '../lib/sides.ts'
import { designPath, STUDIO_QUERY } from '../lib/studio.ts'
import type { Responses, Session, Wedding } from '../lib/types.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { useResponses } from '../lib/useResponses.ts'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import { STEPS } from '../setup/steps.ts'

/** Dashboard overview: a countdown to the day, replies at a glance, and quick ways to share. */
export default function Dashboard() {
  useTitle('Your wedding')
  const { state, refresh } = useAuth()
  // null: decide automatically; true/false: opened from "Show me around", or just closed.
  const [tour, setTour] = useState<boolean | null>(null)
  const [wedding, setWedding] = useWedding()
  const [responses] = useResponses()
  const navigate = useNavigate()
  const location = useLocation()
  // Shown once: keep it for this visit, then clear it from history so a reload doesn't replay it.
  const [justFinished] = useState(
    (location.state as { justFinished?: 'published' | 'draft' } | null)?.justFinished,
  )
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])

  if (state.status !== 'signedIn') return null
  if (wedding.status === 'loading') return <p className="muted">Loading your wedding…</p>
  if (wedding.status === 'error') {
    return <p role="alert" className="alert">Your wedding couldn’t be loaded. Refresh to try again.</p>
  }

  const w = wedding.wedding
  if (!w?.setupCompletedAt) return <SetupPrompt wedding={w} />

  const link = w.slug ? `${window.location.origin}/invite/${w.slug}` : null
  const data = responses.status === 'ready' ? responses.data : null
  const partner = state.couple.partner?.name ?? null
  const tourSeen = Boolean(state.user.tourCompletedAt)
  // First visit after setup: the tour starts by itself (once replies have loaded, so it can show them).
  const tourOpen = tour ?? (!tourSeen && responses.status !== 'loading')

  function endTour() {
    setTour(false)
    if (tourSeen) return
    // Best effort: if this fails, the tour simply offers itself again next visit.
    api.post<Session>('/auth/tour').then(refresh, () => {})
  }

  return (
    <div className="home">
      {tourOpen && <Tour steps={tourSteps(partner)} onClose={endTour} />}
      <Hero wedding={w} onChange={setWedding} onTour={() => setTour(true)} />

      {w.status === 'published' && link && <Celebration link={link} />}
      {justFinished === 'draft' && (
        <p role="status" className="alert alert--success">Saved as a private draft. Publish whenever you’re ready.</p>
      )}

      <UnlockCallout where="overview" />

      <div className="home-grid">
        {data && <ReplyBoard data={data} />}
        <div className="home-side">
          {w.status === 'published' && link && <ShareCard link={link} />}
          <PartnerCard you={state.user.name} partner={partner} />
        </div>
      </div>
    </div>
  )
}

const tourSteps = (partner: string | null): TourStep[] => [
  {
    title: 'Welcome to your wedding space',
    text: 'A quick look around before you start. It takes about half a minute.',
  },
  {
    target: '[data-tour="status"]',
    title: 'Private until you publish',
    text: 'Guests can’t see your invitation until you publish it, and you can unpublish any time.',
  },
  {
    target: '[data-tour="design"]',
    title: 'Make it yours',
    text: 'Change the layout, colours and fonts whenever you like. On a laptop, Studio has every design option. Guests always see the latest version.',
  },
  {
    target: '[data-tour="replies"]',
    title: 'Replies arrive here',
    text: 'See who’s coming at a glance, coloured by whose side they’re from. Responses has the full list.',
  },
  {
    target: '[data-tour="tab-share"]',
    title: 'Share your links',
    text: 'Send one link to everyone, or use your personal links so each reply is counted on your side.',
  },
  {
    target: '[data-tour="tab-gifts"]',
    title: 'Gifts, if you want them',
    text: 'Receive cash, sell aso-ebi or share a wishlist. Unlock Gifts once for ₦5,000, then add your bank account and switch on what you want.',
  },
  {
    target: '[data-tour="partner"]',
    title: 'Plan together',
    text: partner
      ? `You and ${partner} share this space, each with your own sign-in.`
      : 'Invite your partner so you can plan together, each with your own sign-in.',
  },
]

function SetupPrompt({ wedding }: { wedding: Wedding | null }) {
  const step = wedding ? Math.min(wedding.checkpoint, STEPS.length - 1) + 1 : 0
  return (
    <section className="home-hero home-hero--setup" aria-labelledby="setup-title">
      <div>
        <p className="eyebrow">{wedding ? `Step ${step} of ${STEPS.length}` : 'Welcome'}</p>
        <h1 id="setup-title">{wedding ? 'Pick up where you left off' : 'Let’s set up your wedding'}</h1>
        <p className="home-meta">
          A few questions, one at a time. Everything saves as you go, and your invitation builds itself beside you.
        </p>
        <div className="progress progress--lg" aria-hidden="true">
          <span style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
        <Link to="/app/setup" className="btn">{wedding ? 'Continue setup' : 'Start setup'}</Link>
      </div>
    </section>
  )
}

function Countdown({ date }: { date: string | null }) {
  if (!date) return null
  const days = daysUntil(date)
  if (days < 0) {
    return (
      <div className="countdown">
        <span className="countdown-label">Married on {formatDate(date)}</span>
      </div>
    )
  }
  return (
    <div className="countdown" aria-label={days === 0 ? 'The wedding is today' : `${days} days to go`}>
      <span className="countdown-number" aria-hidden="true">{days === 0 ? 'Today' : days}</span>
      <span className="countdown-label" aria-hidden="true">{days === 0 ? 'is the day' : days === 1 ? 'day to go' : 'days to go'}</span>
    </div>
  )
}

function Hero({ wedding, onChange, onTour }: { wedding: Wedding; onChange: (w: Wedding) => void; onTour: () => void }) {
  const studio = useMediaQuery(STUDIO_QUERY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const published = wedding.status === 'published'
  const link = wedding.slug ? `${window.location.origin}/invite/${wedding.slug}` : null

  async function toggle() {
    setBusy(true)
    setError(null)
    setNotReady(false)
    try {
      onChange((await api.post<{ wedding: Wedding }>(published ? '/wedding/unpublish' : '/wedding/publish')).wedding)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_ready') setNotReady(true)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="home-hero" aria-labelledby="couple-names">
      <div className="home-hero-main">
        <div className="home-hero-top">
          <span className={published ? 'badge badge--live' : 'badge'} data-tour="status">{published ? 'Live' : 'Private draft'}</span>
          <button type="button" className="link-button home-edit" onClick={onTour}>Show me around</button>
        </div>
        <h1 id="couple-names">{coupleNames(...namesInOrder(wedding)) || 'Your wedding'}</h1>
        <p className="home-meta">
          {[formatDate(wedding.date), formatTime(wedding.startTime), wedding.venueName].filter(Boolean).join(' · ')}
        </p>

        {error && <p role="alert" className="alert">{error}</p>}
        {notReady && (
          <p role="alert" className="alert">
            Some details are missing. <Link to="/app/setup/finish">Review your answers</Link> to publish.
          </p>
        )}

        <div className="actions">
          <button className={published ? 'btn btn--secondary' : 'btn'} onClick={toggle} disabled={busy}>
            {busy ? 'Saving…' : published ? 'Unpublish' : 'Publish invitation'}
          </button>
          <Link to="/app/setup/names" className="btn btn--secondary">Edit details</Link>
          <Link to={designPath(studio)} className="btn btn--secondary" data-tour="design">Design invitation</Link>
          {published && link && (
            <a href={link} target="_blank" rel="noopener" className="btn btn--secondary">
              View invitation<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
      <Countdown date={wedding.date} />
    </section>
  )
}

// As far across and down their area as a petal goes, in %, so it never reaches the text.
const PETAL_MAX_X = 95
const PETAL_MAX_Y = 80

// Deterministic "random" spread so the petals start scattered and render the same every time.
const PETALS = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 37) % PETAL_MAX_X,
  y: (i * 61) % PETAL_MAX_Y,
  angle: (i * 47) % 360,
  size: 8 + ((i * 17) % 9),
  tone: i % 3,
}))

const between = (min: number, max: number) => min + Math.random() * (max - min)
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Keeps a petal drifting in small random hops until the returned function stops it. */
function wander(petal: Element, { x, y, angle }: (typeof PETALS)[number]) {
  const transform = (s: { x: number; y: number; angle: number }) =>
    `translate(${s.x - x}cqw, ${s.y - y}cqh) rotate(${s.angle}deg)`
  let from = { x, y, angle }
  let animation: Animation

  function hop() {
    const to = {
      x: clamp(from.x + between(-14, 14), 0, PETAL_MAX_X),
      y: clamp(from.y + between(-22, 22), 0, PETAL_MAX_Y),
      angle: from.angle + between(-120, 120),
    }
    animation = petal.animate([{ transform: transform(from) }, { transform: transform(to) }], {
      duration: between(3000, 7000),
      easing: 'ease-in-out',
      fill: 'forwards',
    })
    animation.onfinish = hop
    from = to
  }

  hop()
  return () => {
    animation.onfinish = null
    animation.cancel()
  }
}

/** Petals drifting at random for as long as they're on screen; still for anyone who prefers less motion. */
function Petals() {
  const ref = useRef<HTMLDivElement>(null)
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    if (still || !ref.current) return
    const stops = Array.from(ref.current.children, (petal, i) => wander(petal, PETALS[i]))
    return () => stops.forEach((stop) => stop())
  }, [still])

  return (
    <div className="petals" aria-hidden="true" ref={ref}>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className={`petal petal--${p.tone}`}
          style={
            {
              '--x': `${p.x}%`,
              '--y': `${p.y}%`,
              '--angle': `${p.angle}deg`,
              '--size': `${p.size}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** Shown while the invitation is live: petals drift across the panel, and the link is ready to share. */
function Celebration({ link }: { link: string }) {
  return (
    <section className="celebrate" aria-labelledby="celebrate-title">
      <Petals />
      <div className="celebrate-body">
        <p className="eyebrow">Published</p>
        <h2 id="celebrate-title">Your invitation is live</h2>
        <p className="muted">Send it to your guests. Their replies will appear here as they come in.</p>
        <CopyLink link={link} label="Invitation link" />
        <div className="actions">
          <a className="btn" href={whatsapp(link)} target="_blank" rel="noopener noreferrer">
            Share on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
          <Link to="/app/share" className="btn btn--secondary">Get your personal links</Link>
        </div>
      </div>
    </section>
  )
}

const whatsapp = (link: string) =>
  `https://wa.me/?text=${encodeURIComponent(`You're invited to our wedding. Please reply here: ${link}`)}`

const SIDE_CLASSES = ['side-a', 'side-b']

function ReplyBoard({ data }: { data: Responses }) {
  const { summary, partners, rsvps } = data
  const sideClass = (userId: string | null) =>
    userId ? (SIDE_CLASSES[partners.findIndex((p) => p.userId === userId)] ?? 'side-none') : 'side-none'

  const bar = (kind: 'attending' | 'declined') => {
    const parts = summary.bySide.filter((s) => s[kind] > 0)
    const description = parts.map((s) => `${s[kind]} from ${sideLabel(partners, s.userId).toLowerCase()}`).join(', ')
    return (
      <div className="reply-row">
        <div className="reply-row-head">
          <span>{kind === 'attending' ? 'Attending' : 'Declined'}</span>
          <span className="reply-count">{summary[kind]}</span>
        </div>
        <div
          className="bar"
          role="img"
          aria-label={summary[kind] ? `${summary[kind]} ${kind}: ${description}` : `None ${kind} yet`}
        >
          {parts.map((s) => (
            <span
              key={s.userId ?? 'none'}
              className={sideClass(s.userId)}
              style={{ width: `${(s[kind] / Math.max(summary.total, 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="card board" aria-labelledby="replies-title" data-tour="replies">
      <div className="row row--tight">
        <h2 id="replies-title">Replies</h2>
        <Link to="/app/responses">See all {summary.total > 0 ? summary.total : ''}</Link>
      </div>

      {summary.total === 0 ? (
        <div className="board-empty">
          <p className="countdown-number" aria-hidden="true">0</p>
          <p className="muted">
            No replies yet. <Link to="/app/share">Share your invitation</Link> and they’ll start arriving here.
          </p>
        </div>
      ) : (
        <>
          {bar('attending')}
          {bar('declined')}
          <ul className="legend">
            {[...partners.map((p) => p.userId), null].map((id) => (
              <li key={id ?? 'none'}>
                <span className={`legend-dot ${sideClass(id)}`} aria-hidden="true" />
                {sideLabel(partners, id)}
              </li>
            ))}
          </ul>

          <h3 className="feed-title">Latest</h3>
          <ul className="feed">
            {rsvps.slice(0, 5).map((r) => (
              <li key={r.id}>
                <span className={`avatar ${sideClass(r.sideUserId)}`} aria-hidden="true">{initials(r.name)}</span>
                <span className="feed-text">
                  {r.name} {r.attending ? 'is coming' : 'can’t make it'}
                  <span className="hint">
                    {sideLabel(partners, r.sideUserId)} · {timeAgo(r.createdAt)}
                  </span>
                </span>
                <span className={r.attending ? 'feed-icon feed-icon--yes' : 'feed-icon'} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d={r.attending ? 'M5 12.5l4.5 4.5L19 7.5' : 'M7 7l10 10M17 7L7 17'} />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function ShareCard({ link }: { link: string }) {
  return (
    <section className="card" aria-labelledby="share-title">
      <h2 id="share-title">Share</h2>
      <p className="muted">One link for everyone, or use your personal links to track each side.</p>
      <CopyLink link={link} label="Invitation link" />
      <div className="actions">
        <a className="btn btn--secondary" href={whatsapp(link)} target="_blank" rel="noopener noreferrer">
          WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        <Link to="/app/share" className="btn btn--secondary">Personal links</Link>
      </div>
    </section>
  )
}

function PartnerCard({ you, partner }: { you: string; partner: string | null }) {
  return (
    <section className="card" aria-labelledby="partner-title" data-tour="partner">
      <h2 id="partner-title">Planning together</h2>
      <div className="pair" aria-hidden="true">
        <span className="avatar side-a">{initials(you)}</span>
        <span className={partner ? 'avatar side-b' : 'avatar avatar--empty'}>{partner ? initials(partner) : '+'}</span>
      </div>
      {partner ? (
        <p className="muted">You and {partner} share this wedding space.</p>
      ) : (
        <p className="muted">
          Your partner hasn’t joined yet. <Link to="/partner">Invite them</Link>
        </p>
      )}
    </section>
  )
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function timeAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}
