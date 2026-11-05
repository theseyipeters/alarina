import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import CopyLink from '../components/CopyLink.tsx'
import Field from '../components/Field.tsx'
import { downloadIcs, googleCalendarUrl } from '../invite/calendar.ts'
import EnvelopeIntro, { OPEN_MS } from '../invite/EnvelopeIntro.tsx'
import GiftBasket from '../invite/GiftBasket.tsx'
import { inviteAttrs } from '../invite/design.ts'
import InvitationCard from '../invite/InvitationCard.tsx'
import { venueStops } from '../invite/venues.ts'
import { namesInOrder } from '../invite/order.ts'
import { mapLink } from '../invite/maps.ts'
import RsvpForm from '../invite/RsvpForm.tsx'
import '../invite/styles.ts'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { coupleNames, daysUntil, formatDate } from '../lib/format.ts'
import type { PublicInvitation, Rsvp } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type State =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready'; invitation: PublicInvitation }

export default function Invitation() {
  const { slug = '' } = useParams()
  // A partner's personal link adds ?from=code, so the reply is marked as their side.
  const from = useSearchParams()[0].get('from')
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get<{ invitation: PublicInvitation }>(`/public/invitations/${encodeURIComponent(slug)}`).then(
      ({ invitation }) => !cancelled && setState({ status: 'ready', invitation }),
      (err) => !cancelled && setState({ status: err instanceof ApiError && err.status === 404 ? 'missing' : 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [slug])

  const names = state.status === 'ready' ? coupleNames(...namesInOrder(state.invitation)) : ''
  useTitle(names ? `${names} are getting married` : 'Wedding invitation')

  if (state.status === 'loading') return <p className="page muted">Opening the invitation…</p>
  if (state.status !== 'ready') {
    return (
      <main id="main" className="page">
        <div className="card">
          <h1>{state.status === 'missing' ? 'Invitation not available' : 'Something went wrong'}</h1>
          <p className="muted">
            {state.status === 'missing'
              ? 'This invitation hasn’t been published, or the link is incorrect. Check with the couple for the right link.'
              : 'The invitation couldn’t be loaded. Check your connection and refresh the page.'}
          </p>
        </div>
      </main>
    )
  }

  return <InvitationView invitation={state.invitation} names={names} from={from} />
}

type Stage = 'sealed' | 'opening' | 'open'

const openedKey = (slug: string) => `alarina-opened-${slug}`

const repliedKey = (slug: string) => `alarina-replied-${slug}`

type Replied = { name: string; emailSent: boolean }

/**
 * Who replied from this browser. Each browser sends one reply per wedding, and anyone else invited
 * replies from their own. It never holds the private link, in case someone else picks up the phone.
 */
function readReplied(slug: string): Replied | null {
  try {
    // `firstName`: what this held before the gift basket needed the guest's whole name.
    const saved = JSON.parse(localStorage.getItem(repliedKey(slug)) ?? 'null') as (Partial<Replied> & { firstName?: string }) | null
    const name = saved?.name ?? saved?.firstName
    return typeof name === 'string' ? { name, emailSent: Boolean(saved?.emailSent) } : null
  } catch {
    // Storage can be blocked; the form simply shows.
    return null
  }
}

function rememberReplied(slug: string, replied: Replied) {
  try {
    localStorage.setItem(repliedKey(slug), JSON.stringify(replied))
  } catch {
    // Not remembered; harmless.
  }
}

/** Guests open the envelope once per visit; it's skipped for reduced motion or once opened. */
function initialStage(slug: string): Stage {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'open'
    if (sessionStorage.getItem(openedKey(slug))) return 'open'
  } catch {
    // Storage can be blocked; the envelope simply shows again.
  }
  return 'sealed'
}

function InvitationView({ invitation, names, from }: { invitation: PublicInvitation; names: string; from: string | null }) {
  const [stage, setStage] = useState<Stage>(() => initialStage(invitation.slug))
  const [rsvpInView, setRsvpInView] = useState(false)
  const rsvpRef = useRef<HTMLElement>(null)
  const openedByGuest = useRef(false)

  function open() {
    openedByGuest.current = true
    setStage('opening')
    window.setTimeout(() => {
      try {
        sessionStorage.setItem(openedKey(invitation.slug), '1')
      } catch {
        // Not remembered; harmless.
      }
      setStage('open')
    }, OPEN_MS)
  }

  // After the guest opens the envelope, move focus to the invitation so keyboard and
  // screen-reader users land on it (the button they pressed is gone).
  useEffect(() => {
    if (stage !== 'open' || !openedByGuest.current) return
    const heading = document.getElementById('inv-names')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
  }, [stage])

  // The sticky RSVP button on phones hides once the RSVP section itself is on screen.
  useEffect(() => {
    const el = rsvpRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setRsvpInView(Boolean(entry?.isIntersecting)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [stage])

  const monogram = namesInOrder(invitation)
    .map((n) => n?.normalize('NFC').trim()[0] ?? '')
    .join('')

  return (
    <div className="inv inv--page" {...inviteAttrs(invitation)}>
      {stage !== 'open' ? (
        <main id="main">
          <EnvelopeIntro invitation={invitation} opening={stage === 'opening'} onOpen={open} />
        </main>
      ) : (
        <>
          <span className="inv-monogram" aria-hidden="true">{monogram}</span>
          <main id="main" className="inv-column inv-reveal">
            <InvitationCard invitation={invitation} />
            <PlanYourDay invitation={invitation} />
            <RsvpPanel invitation={invitation} names={names} from={from} sectionRef={rsvpRef} />
            <p className="inv-footer">
              Made with <Link to="/">Alárinà</Link>
            </p>
          </main>
          {invitation.rsvpOpen && !rsvpInView && (
            <a href="#rsvp" className="btn rsvp-fab">RSVP</a>
          )}
        </>
      )}
    </div>
  )
}

function countdownText(date: string | null) {
  if (!date) return null
  const days = daysUntil(date)
  if (days > 1) return `In ${days} days`
  if (days === 1) return 'Tomorrow'
  if (days === 0) return 'Today is the day'
  return 'This celebration has taken place'
}

function CalendarButtons({ invitation }: { invitation: PublicInvitation }) {
  return (
    <>
      <a className="btn btn--secondary" href={googleCalendarUrl(invitation)} target="_blank" rel="noopener noreferrer">
        Google Calendar<span className="visually-hidden"> (opens in a new tab)</span>
      </a>
      <button type="button" className="btn btn--secondary" onClick={() => downloadIcs(invitation)}>
        Apple or Outlook
      </button>
    </>
  )
}

/** Countdown, calendar and directions: the practical bits, right under the invitation. */
function PlanYourDay({ invitation }: { invitation: PublicInvitation }) {
  const countdown = countdownText(invitation.date)
  const upcoming = invitation.date ? daysUntil(invitation.date) >= 0 : false

  return (
    <section className="plan" aria-labelledby="plan-title">
      <p id="plan-title" className="plan-countdown">{countdown}</p>
      {upcoming && (
        <>
          <p className="plan-label">Add it to your calendar</p>
          <div className="actions plan-actions">
            <CalendarButtons invitation={invitation} />
            {/* One button for one venue; one per event, by the couple's name for it, for two. */}
            {venueStops(invitation).map((stop, _, stops) => (
              <a
                key={stop.key}
                className="btn btn--secondary"
                href={mapLink(stop.name, stop.address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {stops.length > 1 && stop.label ? `Directions to ${stop.label}` : 'Directions'}
                <span className="visually-hidden">, {stop.name} (opens in a new tab)</span>
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

/** For a guest who lost their private link. Says the same thing whether or not the address has replied. */
function LinkRecovery({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post(`/public/invitations/${encodeURIComponent(slug)}/rsvps/resend`, { email })
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) return <p role="status" className="alert alert--success">If that email replied to this invitation, your link is on its way.</p>
  if (!open) {
    return (
      <p>
        <button type="button" className="link-button" onClick={() => setOpen(true)}>Email me my link</button>
      </p>
    )
  }
  return (
    <form onSubmit={send}>
      {error && <p role="alert" className="alert">{error}</p>}
      <Field label="Your email" hint="The one you replied with.">
        {(p) => (
          <input
            {...p}
            type="email"
            autoComplete="email"
            autoFocus
            required
            maxLength={254}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>
      <button className="btn btn--secondary" disabled={busy}>{busy ? 'Sending…' : 'Email me my link'}</button>
    </form>
  )
}

type Created = { rsvp: Rsvp; editLink: string; emailSent: boolean }

type RsvpPanelProps = {
  invitation: PublicInvitation
  names: string
  from: string | null
  sectionRef: RefObject<HTMLElement | null>
}

function RsvpPanel({ invitation, names, from, sectionRef }: RsvpPanelProps) {
  const [created, setCreated] = useState<Created | null>(null)
  const [replied, setReplied] = useState(() => readReplied(invitation.slug))
  const [duplicate, setDuplicate] = useState<{ emailSent: boolean } | null>(null)
  const [closed, setClosed] = useState(!invitation.rsvpOpen)
  const [error, setError] = useState<string | null>(null)

  async function submit(values: { name: string; email: string; phone: string; attending: boolean }) {
    // Checked again here: the form may have been open in another tab when the reply was sent.
    const already = readReplied(invitation.slug)
    if (already) {
      setReplied(already)
      return
    }
    setError(null)
    setDuplicate(null)
    try {
      const result = await api.post<Created>(`/public/invitations/${encodeURIComponent(invitation.slug)}/rsvps`, {
        ...values,
        ...(from && { from }),
      })
      setCreated(result)
      rememberReplied(invitation.slug, { name: result.rsvp.name, emailSent: result.emailSent })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'already_responded') {
        setDuplicate(err.details as { emailSent: boolean })
      } else if (err instanceof ApiError && err.code === 'rsvp_closed') {
        setClosed(true)
      } else {
        setError(errorMessage(err))
      }
    }
  }

  if (created) {
    const { rsvp, editLink, emailSent } = created
    const firstName = rsvp.name.trim().split(/\s+/)[0]
    return (
      <section id="rsvp" ref={sectionRef} className="inv-panel rsvp-done" aria-labelledby="rsvp-heading" role="status">
        <svg className="rsvp-check" viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d={rsvp.attending ? 'M15 27l7 7 15-16' : 'M18 18l16 16M34 18L18 34'} />
        </svg>
        <h2 id="rsvp-heading">
          {rsvp.attending ? 'We’ve received your reply' : `Thank you, ${firstName}`}
        </h2>
        <p>
          {rsvp.attending
            ? `Thank you, ${firstName}. ${names} will reach out if there’s anything you need to know.`
            : `${names} will miss you. Thanks for letting them know.`}
        </p>
        {rsvp.attending && invitation.date && daysUntil(invitation.date) >= 0 && (
          <div className="actions rsvp-done-actions">
            <CalendarButtons invitation={invitation} />
          </div>
        )}
        <GiftBasket
          invitation={invitation}
          names={names}
          guest={{ name: rsvp.name, email: rsvp.email, phone: rsvp.phone }}
          rsvpToken={new URL(editLink).pathname.split('/').pop()}
        />
        <div className="rsvp-done-link">
          <p className="muted">
            Your private link to change your reply. Keep it to yourself: anyone with it can change your reply.
          </p>
          <CopyLink link={editLink} label="Your private RSVP link" />
          {emailSent && <p className="hint">We’ve also emailed it to you.</p>}
          <p>
            <Link to={new URL(editLink).pathname}>Change my reply</Link>
          </p>
        </div>
      </section>
    )
  }

  // Past the deadline this still shows: guests can give, and may need their link, until the day.
  if (replied && invitation.rsvpClosedReason !== 'past') {
    return (
      <section id="rsvp" ref={sectionRef} className="inv-panel" aria-labelledby="rsvp-heading">
        <h2 id="rsvp-heading">You’ve already replied, {replied.name.trim().split(/\s+/)[0]}</h2>
        <p className="muted">
          {replied.emailSent
            ? 'To change your reply, use the private link we emailed you.'
            : 'To change your reply, use the private link you got when you replied.'}
        </p>
        {!closed && <p className="muted">Each device can send one reply, so anyone else invited should use their own.</p>}
        <LinkRecovery slug={invitation.slug} />
        {/* Not tied to the reply, as this browser doesn't keep the private link. The name still tells the couple who gave. */}
        <GiftBasket invitation={invitation} names={names} guest={{ name: replied.name }} />
      </section>
    )
  }

  return (
    <section id="rsvp" ref={sectionRef} className="inv-panel" aria-labelledby="rsvp-heading">
      <h2 id="rsvp-heading">Will you join us?</h2>
      {closed ? (
        <p className="muted">
          {invitation.rsvpClosedReason === 'past'
            ? 'This wedding has already taken place.'
            : 'RSVPs have closed. If you need to change your plans, contact the couple directly.'}
        </p>
      ) : (
        <>
          <p className="muted">
            {invitation.rsvpDeadline
              ? `Kindly respond on or before ${formatDate(invitation.rsvpDeadline)}. It takes less than a minute.`
              : `Let ${names} know if you can make it. It takes less than a minute.`}
          </p>
          {duplicate && (
            <p role="alert" className="alert">
              You’ve already replied with this email.{' '}
              {duplicate.emailSent
                ? 'We’ve emailed you a link to change your reply.'
                : 'Use the private link you got when you replied to change it.'}
            </p>
          )}
          {error && <p role="alert" className="alert">{error}</p>}
          <RsvpForm submitLabel="Send reply" busyLabel="Sending…" onSubmit={submit} />
        </>
      )}
    </section>
  )
}
