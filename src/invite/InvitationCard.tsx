import type { CSSProperties, ReactNode } from 'react'
import { formatDate, formatTime } from '../lib/format.ts'
import type { InvitationContent, WeddingEvent } from '../lib/types.ts'
import { elorienCanRender } from './design.ts'
import { mapLink } from './maps.ts'

export type InvitationPart = 'families' | 'names' | 'when' | 'where' | 'dress' | 'rsvp' | 'message' | 'events'

type Props = {
  invitation: InvitationContent
  /** In the setup preview, the part being answered right now gets data-active for a highlight. */
  highlight?: InvitationPart | null
}

type PartProps = { 'data-part': InvitationPart; 'data-active'?: true }
type Ctx = { w: InvitationContent; part: (name: InvitationPart) => PartProps; nameClass?: string }

/**
 * The invitation itself, in one of three layouts. Colours come from data-palette and the layout
 * from data-template on an ancestor; the card sizes itself to its own width (container queries),
 * so it looks right on a phone, in previews and on desktop.
 */
export default function InvitationCard({ invitation, highlight }: Props) {
  const w = invitation
  const part = (name: InvitationPart): PartProps => ({ 'data-part': name, ...(highlight === name && { 'data-active': true }) })

  // Modern sets the names in Elorien only when it can draw every character of both, so the
  // couple's names always match; otherwise both stay in the fallback serif.
  const both = `${w.partnerOneName ?? ''}${w.partnerTwoName ?? ''}`
  const nameClass = w.template === 'modern' && elorienCanRender(both) ? 'inv-display--elorien' : undefined
  const ctx: Ctx = { w, part, nameClass }

  return (
    <article className="inv-card" aria-labelledby="inv-names">
      {w.template === 'modern' ? <Modern {...ctx} /> : w.template === 'editorial' ? <Editorial {...ctx} /> : <Classic {...ctx} />}
    </article>
  )
}

/* ── Shared pieces ──────────────────────────────────────────────────── */

function dateParts(date: string | null) {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  const value = new Date(y!, m! - 1, d!)
  const get = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-NG', opts).format(value)
  return {
    weekday: get({ weekday: 'long' }),
    day: String(d),
    month: get({ month: 'long' }),
    year: String(y),
    numeric: `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${String(y).slice(2)}`,
  }
}

/** "09:30" → "half past nine in the morning"; other times → "6:15 in the evening". */
function timePhrase(time: string | null) {
  if (!time) return null
  const [h, min] = time.split(':').map(Number) as [number, number]
  const period = h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : 'in the evening'
  const words = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven']
  const hour = words[h % 12]!
  if (min === 0) return `${hour} o’clock ${period}`
  if (min === 30) return `half past ${hour} ${period}`
  return `${formatTime(time).replace(/\s?(am|pm)$/, '')} ${period}`
}

/** 1 → "1st", 2 → "2nd", 11 → "11th", 22 → "22nd" */
function ordinal(n: number) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${suffix}`
}

function roman(n: number) {
  const table: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  for (const [value, numeral] of table) {
    while (n >= value) {
      out += numeral
      n -= value
    }
  }
  return out
}

/** The last part of the address, usually the city ("…, Ojota, Lagos" → "Lagos"). */
const cityOf = (address: string | null) =>
  address
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .at(-1) ?? null

function Names({ w, part, nameClass, amp = '&' }: Ctx & { amp?: ReactNode }) {
  // Long names shrink just enough to stay on one line (CSS divides the width by --chars).
  const chars = Math.max(...[w.partnerOneName, w.partnerTwoName].map((n) => [...(n ?? '').normalize('NFC')].length), 6)
  return (
    <h1 id="inv-names" className="inv-names" style={{ '--chars': chars } as CSSProperties} {...part('names')}>
      <span className={nameClass}>{w.partnerOneName}</span>
      <span className="inv-amp">{amp}</span>
      <span className={nameClass}>{w.partnerTwoName}</span>
    </h1>
  )
}

function Venue({ w }: { w: InvitationContent }) {
  return (
    <>
      <span className="inv-venue">{w.venueName}</span>
      {w.venueAddress && <span className="inv-sub">{w.venueAddress}</span>}
      {w.venueName && (
        <a className="inv-sub inv-map" href={mapLink(w.venueName, w.venueAddress)} target="_blank" rel="noopener noreferrer">
          Open in Maps<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      )}
    </>
  )
}

function Events({ events, part, title }: { events: WeddingEvent[]; part: Ctx['part']; title: string }) {
  const named = events.filter((e) => e.name.trim())
  if (!named.length) return null
  return (
    <section className="inv-events-section" aria-labelledby="inv-events" {...part('events')}>
      <h2 id="inv-events" className="inv-section-title">{title}</h2>
      <ol className="inv-events">
        {named.map((e) => (
          <li key={e.id}>
            <span className="inv-event-name">{e.name}</span>
            {(e.date || e.startTime) && (
              <span className="inv-sub">{[formatDate(e.date), formatTime(e.startTime)].filter(Boolean).join(' · ')}</span>
            )}
            {e.venueName && <span className="inv-sub">{[e.venueName, e.venueAddress].filter(Boolean).join(', ')}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}

/* Thin ornaments, drawn in the palette's accent colour. Purely decorative. */

function Sprig() {
  return (
    <svg className="inv-ornament inv-sprig" viewBox="0 0 120 32" aria-hidden="true">
      <path d="M60 30V4" />
      <path d="M60 22c-8-1-15-6-18-13 7 0 14 5 18 13zM60 22c8-1 15-6 18-13-7 0-14 5-18 13z" />
      <path d="M60 13c-6-1-10-5-12-10 5 0 10 4 12 10zM60 13c6-1 10-5 12-10-5 0-10 4-12 10z" />
      <path d="M8 28h34M78 28h34" />
    </svg>
  )
}

function Diamond() {
  return (
    <svg className="inv-ornament inv-divider" viewBox="0 0 120 12" aria-hidden="true">
      <path d="M4 6h46M70 6h46M60 1l5 5-5 5-5-5z" />
    </svg>
  )
}

/** Flourishes for the two lower corners; the top of the Classic frame is an arch. */
function Corners() {
  return (
    <span className="inv-corners" aria-hidden="true">
      {['bl', 'br'].map((c) => (
        <svg key={c} className={`inv-corner inv-corner--${c}`} viewBox="0 0 32 32">
          <path d="M2 30V12C2 6 6 2 12 2h18M8 30V16c0-4 4-8 8-8h14" />
        </svg>
      ))}
    </span>
  )
}

/* ── Classic: arched stationery ─────────────────────────────────────── */

function Classic(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = [w.partnerOneFamily, w.partnerTwoFamily].filter(Boolean)

  return (
    <div className="c-frame">
      <Corners />
      <Sprig />

      {families.length > 0 && (
        <div className="c-families" {...part('families')}>
          <p className="inv-eyebrow">Together with their families</p>
          <p className="inv-families">{families.join(' & ')}</p>
        </div>
      )}

      <p className="c-invite">request the pleasure of your company at the marriage of</p>
      <Names {...ctx} />
      <Diamond />

      {date && (
        <div className="c-date" {...part('when')}>
          <span className="c-date-side">{date.weekday}</span>
          <span className="c-date-day">{date.day}</span>
          <span className="c-date-side">
            {date.month}
            <br />
            {date.year}
          </span>
          {w.startTime && <span className="c-time">at {timePhrase(w.startTime)}</span>}
        </div>
      )}

      <div className="c-block" {...part('where')}>
        <Venue w={w} />
      </div>

      {w.dressNote && (
        <div className="c-block" {...part('dress')}>
          <span className="inv-eyebrow">Dress code</span>
          <span>{w.dressNote}</span>
        </div>
      )}

      {w.message && (
        <blockquote className="inv-quote" {...part('message')}>
          {w.message}
        </blockquote>
      )}

      <Events events={w.events} part={part} title="Also celebrating" />

      {w.rsvpDeadline && (
        <p className="c-rsvp" {...part('rsvp')}>
          Kindly reply by {formatDate(w.rsvpDeadline)}
        </p>
      )}
    </div>
  )
}

/* ── Modern: asymmetric, numerals ───────────────────────────────────── */

function Modern(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = [w.partnerOneFamily, w.partnerTwoFamily].filter(Boolean)
  const city = cityOf(w.venueAddress)

  return (
    <div className="m-layout">
      <span className="m-side" aria-hidden="true">
        {['The wedding', city, date?.year].filter(Boolean).join(' — ')}
      </span>

      <header className="m-head">
        {families.length > 0 && (
          <p className="m-families" {...part('families')}>
            {families.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </p>
        )}
        <p className="inv-eyebrow m-kicker">invite you to the wedding of</p>
      </header>

      <Names {...ctx} amp="+" />

      {date && (
        <div className="m-date" {...part('when')}>
          <span className="m-numerals">{date.numeric}</span>
          <span className="m-date-words">
            {date.weekday}
            {w.startTime && (
              <>
                <br />
                {formatTime(w.startTime)}
              </>
            )}
          </span>
        </div>
      )}

      <dl className="m-rows">
        <div {...part('where')}>
          <dt>Where</dt>
          <dd>
            <Venue w={w} />
          </dd>
        </div>
        {w.dressNote && (
          <div {...part('dress')}>
            <dt>Dress code</dt>
            <dd>{w.dressNote}</dd>
          </div>
        )}
        {w.rsvpDeadline && (
          <div {...part('rsvp')}>
            <dt>Reply by</dt>
            <dd>{formatDate(w.rsvpDeadline)}</dd>
          </div>
        )}
      </dl>

      {w.message && (
        <p className="m-message" {...part('message')}>
          {w.message}
        </p>
      )}

      <Events events={w.events} part={part} title="Programme" />
    </div>
  )
}

/* ── Editorial: magazine masthead ───────────────────────────────────── */

function Editorial(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = [w.partnerOneFamily, w.partnerTwoFamily].filter(Boolean)
  const city = cityOf(w.venueAddress)

  return (
    <div className="e-layout">
      <header className="e-masthead">
        <span>The wedding of</span>
        <span>{[city, date && roman(Number(date.year))].filter(Boolean).join(' · ')}</span>
      </header>

      <div className="e-cover">
        <span className="e-ampersand" aria-hidden="true">&amp;</span>
        <Names {...ctx} amp={<em>and</em>} />
      </div>

      {date && (
        <p className="e-sentence" {...part('when')}>
          {date.weekday}, the {ordinal(Number(date.day))} of {date.month} {date.year}
          {w.startTime && <>, at {timePhrase(w.startTime)}</>}
        </p>
      )}

      <div className="e-columns">
        {families.length > 0 && (
          <div {...part('families')}>
            <h2 className="e-label">Hosted by</h2>
            {families.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>
        )}
        <div {...part('where')}>
          <h2 className="e-label">The venue</h2>
          <Venue w={w} />
        </div>
        {w.dressNote && (
          <div {...part('dress')}>
            <h2 className="e-label">Dress code</h2>
            <p>{w.dressNote}</p>
          </div>
        )}
        {w.rsvpDeadline && (
          <div {...part('rsvp')}>
            <h2 className="e-label">Reply by</h2>
            <p>{formatDate(w.rsvpDeadline)}</p>
          </div>
        )}
      </div>

      {w.message && (
        // A drop cap only suits a message long enough to wrap around it.
        <p className={w.message.length > 120 ? 'e-letter e-letter--dropcap' : 'e-letter'} {...part('message')}>
          {w.message}
        </p>
      )}

      <Events events={w.events} part={part} title="Also in this issue" />
    </div>
  )
}
