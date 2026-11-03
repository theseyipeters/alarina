import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { formatDate, formatTime } from '../lib/format.ts'
import type { InvitationContent, WeddingEvent } from '../lib/types.ts'
import { JOINERS, resolveLook, type Template } from './design.ts'
import { mapLink } from './maps.ts'
import { parentSides, type ParentSide } from './parents.ts'

export type InvitationPart = 'families' | 'names' | 'when' | 'where' | 'dress' | 'rsvp' | 'message' | 'events'

type Props = {
  invitation: InvitationContent
  /** In the setup preview, the part being answered right now gets data-active for a highlight. */
  highlight?: InvitationPart | null
  /** Prefix for element ids, so several cards (Studio thumbnails) can share a page. */
  idPrefix?: string
}

type PartProps = { 'data-part': InvitationPart; 'data-active'?: true }
type Ctx = { w: InvitationContent; part: (name: InvitationPart) => PartProps; id: (name: string) => string; amp: string }

const LAYOUTS: Record<Template, (ctx: Ctx) => ReactNode> = {
  classic: Classic,
  modern: Modern,
  editorial: Editorial,
  garden: Garden,
  deco: Deco,
  adire: Adire,
  minimal: Minimal,
  poster: Poster,
}

/**
 * The invitation itself, in one of eight layouts. Colours, fonts and finish come from the
 * attributes inviteAttrs() puts on an ancestor; the card sizes itself to its own width
 * (container queries), so it looks right on a phone, in previews and on desktop.
 */
export default function InvitationCard({ invitation, highlight, idPrefix = 'inv' }: Props) {
  const w = invitation
  const part = (name: InvitationPart): PartProps => ({ 'data-part': name, ...(highlight === name && { 'data-active': true }) })
  const id = (name: string) => `${idPrefix}-${name}`
  const amp = JOINERS[resolveLook(w.template, w.look).joiner]
  const Layout = LAYOUTS[w.template] ?? Classic

  return (
    <article className="inv-card" aria-labelledby={id('names')}>
      <Layout w={w} part={part} id={id} amp={amp} />
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

function Names({ w, part, id, amp }: Ctx) {
  // Long names shrink just enough to stay on one line (CSS divides the width by --chars).
  const chars = Math.max(...[w.partnerOneName, w.partnerTwoName].map((n) => [...(n ?? '').normalize('NFC')].length), 6)
  return (
    <h1 id={id('names')} className="inv-names" style={{ '--chars': chars } as CSSProperties} {...part('names')}>
      <span>{w.partnerOneName}</span>
      <span className="inv-amp">{amp}</span>
      <span>{w.partnerTwoName}</span>
    </h1>
  )
}

/** The couple's first initials, e.g. "A & T". */
const initials = (w: InvitationContent) =>
  [w.partnerOneName, w.partnerTwoName].map((n) => n?.normalize('NFC').trim()[0] ?? '').filter(Boolean)

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

function Events({ events, part, id, title }: { events: WeddingEvent[]; part: Ctx['part']; id: Ctx['id']; title: string }) {
  const named = events.filter((e) => e.name.trim())
  if (!named.length) return null
  return (
    <section className="inv-events-section" aria-labelledby={id('events')} {...part('events')}>
      <h2 id={id('events')} className="inv-section-title">{title}</h2>
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

/** Parents when the couple has added them, otherwise the older one-line family names. */
function familiesOf(w: InvitationContent) {
  const sides = parentSides(w)
  const legacy = sides.length ? [] : [w.partnerOneFamily, w.partnerTwoFamily].filter((f): f is string => !!f)
  return { sides, legacy, any: sides.length > 0 || legacy.length > 0 }
}

type ParentsProps = {
  sides: ParentSide[]
  className: string
  /** Between father and mother. */
  and?: string
  /** Drawn on the rule between the two sides; false leaves the sides apart with no rule. */
  mark?: ReactNode | false
}

/**
 * Each side's father and mother, then whose parents they are. The block is its own container,
 * so on a narrow card the sides stack instead of squeezing names until words break.
 */
function Parents({ sides, className, and = 'and', mark = null }: ParentsProps) {
  // The longest run of letters that can't wrap: a word, a title held to its name, or the first
  // name in the caption (set smaller, but in spaced capitals). CSS shrinks text to fit it.
  const length = (text: string) => [...text.normalize('NFC')].length
  const words = sides.flatMap((s) => s.parents.flatMap((p) => keepTitle(p.name).split(' ')))
  const chars = Math.max(8, ...words.map(length), ...sides.map((s) => Math.ceil(length(firstName(s.partner) ?? '') * 1.1)))
  return (
    <div className={`inv-parents ${className}`}>
      <div
        className="inv-parents-grid"
        style={{ '--parents-chars': chars } as CSSProperties}
        data-sides={sides.length}
        {...(chars > 16 && { 'data-stack': true })}
        {...(mark === false && { 'data-mark': 'none' })}
      >
        {sides.map((side, i) => (
          <Fragment key={side.parents[0]!.field}>
            {i > 0 && mark !== false && (
              <span className="inv-parents-mark" aria-hidden="true">
                {mark}
              </span>
            )}
            <p className="inv-parents-side">
              {/* The spaces aren't drawn between flex items, but keep the words apart for screen readers. */}
              {side.parents.map((p, j) => (
                <Fragment key={p.field}>
                  {j > 0 && <span className="inv-parents-and">{and}</span>}{' '}
                  <span className="inv-parent">
                    {p.late && <span className="inv-late">Late </span>}
                    {keepTitle(p.name)}
                  </span>{' '}
                </Fragment>
              ))}
              <span className="inv-parents-of">{relation(side)}</span>
            </p>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

const TITLES = /^(mr|mrs|ms|miss|dr|chief|prof|engr|rev|barr|sir|lady|oba|alhaji|alhaja|elder|pastor|deacon|deaconess|evang)\.?$/i

/** "Mr. Olorundare" never splits at the title: a line break there reads as two people. */
function keepTitle(name: string) {
  const [first, ...rest] = name.split(/\s+/)
  return rest.length && TITLES.test(first!) ? `${first}\u00a0${rest.join(' ')}` : name
}

/** "Parents of Ibukun", or "Father of Ibukun" when only one is named. First name only, to stay short. */
function relation(side: ParentSide) {
  const who = side.parents.length > 1 ? 'Parents' : side.parents[0]!.field.endsWith('Father') ? 'Father' : 'Mother'
  const first = firstName(side.partner)
  return first ? `${who} of ${first}` : who
}

const firstName = (name: string | null) => name?.split(/\s+/)[0] ?? null

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

/** Two petals, for the rule between the families. */
function Bud() {
  return (
    <svg className="inv-ornament" viewBox="0 0 12 24" aria-hidden="true">
      <path d="M6 2c3 3 3 7 0 10-3-3-3-7 0-10zM6 22c3-3 3-7 0-10-3 3-3 7 0 10z" />
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
  const families = familiesOf(w)

  return (
    <div className="c-frame">
      <Corners />
      <Sprig />

      {families.any && (
        <div className="c-families" {...part('families')}>
          <p className="inv-eyebrow">Together with their families</p>
          {families.sides.length ? (
            <Parents sides={families.sides} className="c-parents" mark={<Bud />} />
          ) : (
            <p className="inv-families">{families.legacy.join(' & ')}</p>
          )}
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
          {w.startTime && <span className="c-time">at {formatTime(w.startTime)}</span>}
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

      <Events events={w.events} part={part} id={ctx.id} title="Also celebrating" />

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
  const families = familiesOf(w)
  const city = cityOf(w.venueAddress)

  return (
    <div className="m-layout">
      <span className="m-side" aria-hidden="true">
        {['The wedding', city, date?.year].filter(Boolean).join(' — ')}
      </span>

      <header className="m-head">
        {families.sides.length > 0 && (
          <div className="m-hosts" {...part('families')}>
            <Parents sides={families.sides} className="m-parents" and="&" mark={false} />
          </div>
        )}
        {families.legacy.length > 0 && (
          <p className="m-families" {...part('families')}>
            {families.legacy.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </p>
        )}
        <p className="inv-eyebrow m-kicker">invite you to the wedding of</p>
      </header>

      <Names {...ctx} />

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

      <Events events={w.events} part={part} id={ctx.id} title="Programme" />
    </div>
  )
}

/* ── Editorial: magazine masthead ───────────────────────────────────── */

function Editorial(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = familiesOf(w)
  const city = cityOf(w.venueAddress)

  return (
    <div className="e-layout">
      <header className="e-masthead">
        <span>The wedding of</span>
        <span>{[city, date && roman(Number(date.year))].filter(Boolean).join(' · ')}</span>
      </header>

      <div className="e-cover">
        <span className="e-ampersand" aria-hidden="true">&amp;</span>
        <Names {...ctx} />
      </div>

      {date && (
        <p className="e-sentence" {...part('when')}>
          {date.weekday}, the {ordinal(Number(date.day))} of {date.month} {date.year}
          {w.startTime && <>, at {formatTime(w.startTime)}</>}
        </p>
      )}

      <div className="e-columns">
        {families.any && (
          <div className={families.sides.length ? 'e-hosts' : undefined} {...part('families')}>
            <h2 className="e-label">Hosted by</h2>
            {families.sides.length ? (
              <Parents sides={families.sides} className="e-parents" />
            ) : (
              families.legacy.map((f) => <p key={f}>{f}</p>)
            )}
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

      <Events events={w.events} part={part} id={ctx.id} title="Also in this issue" />
    </div>
  )
}

/* ── Garden: a leafy wreath and script names ───────────────────────── */

/** A ring of line-drawn leaves, open at the bottom, around the couple's initials. */
function Wreath({ w }: { w: InvitationContent }) {
  const leaves = Array.from({ length: 18 }, (_, i) => -150 + i * 17.5)
  return (
    <div className="g-wreath" aria-hidden="true">
      <svg className="inv-ornament" viewBox="0 0 100 100">
        <path d="M24 82A40 40 0 1 1 76 82" />
        {leaves.map((angle, i) => (
          <path
            key={angle}
            transform={`rotate(${angle} 50 50)`}
            d={i % 2 ? 'M50 10c4-4 9-5 12-3-2 4-7 6-12 3z' : 'M50 10c-4-4-9-5-12-3 2 4 7 6 12 3z'}
          />
        ))}
        <path d="M24 82c6 2 12 1 16-3M76 82c-6 2-12 1-16-3" />
      </svg>
      <span className="g-initials">{initials(w).join(' ')}</span>
    </div>
  )
}

/** A curling stem with leaves, for two opposite corners. */
function Vine({ className }: { className: string }) {
  return (
    <svg className={`inv-ornament g-vine ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <path d="M4 6c30 2 52 16 64 40s18 46 14 68" />
      <path d="M26 9c4-8 13-11 20-9-3 8-12 11-20 9zM44 18c8-4 17-2 21 4-7 5-16 3-21-4zM56 33c3-9 11-14 19-13-1 9-10 14-19 13zM66 50c9-2 17 3 19 10-8 3-16-1-19-10zM70 70c5-8 14-10 21-7-4 8-13 10-21 7zM76 90c8 1 14 7 14 14-8 0-14-6-14-14z" />
    </svg>
  )
}

/** A stem with two leaves, standing between the families. */
function LeafMark() {
  return (
    <svg className="inv-ornament" viewBox="0 0 16 28" aria-hidden="true">
      <path d="M8 2v24M8 12c-4-1-6-4-6-8 4 0 6 3 6 8zM8 20c4-1 6-4 6-8-4 0-6 3-6 8z" />
    </svg>
  )
}

function LeafDivider() {
  return (
    <svg className="inv-ornament g-leaves" viewBox="0 0 160 20" aria-hidden="true">
      <path d="M8 10h56M96 10h56" />
      <path d="M80 10c-6-6-14-7-18-4 4 5 12 6 18 4zM80 10c6-6 14-7 18-4-4 5-12 6-18 4zM80 10c-6 6-14 7-18 4 4-5 12-6 18-4zM80 10c6 6 14 7 18 4-4-5-12-6-18-4z" />
    </svg>
  )
}

function Garden(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = familiesOf(w)

  return (
    <div className="g-layout">
      <Vine className="g-vine--top" />
      <Vine className="g-vine--bottom" />
      <Wreath w={w} />

      {families.any && (
        <div className="g-families" {...part('families')}>
          <p className="inv-eyebrow">Together with their families</p>
          {families.sides.length ? (
            <Parents sides={families.sides} className="g-parents" and="&" mark={<LeafMark />} />
          ) : (
            <p className="inv-families">{families.legacy.join(' & ')}</p>
          )}
        </div>
      )}

      <p className="g-invite">invite you to celebrate their wedding</p>
      <Names {...ctx} />
      <LeafDivider />

      {date && (
        <div className="g-date" {...part('when')}>
          <span className="g-date-main">
            {date.weekday}, {date.day} {date.month} {date.year}
          </span>
          {w.startTime && <span className="inv-sub">at {formatTime(w.startTime)}</span>}
        </div>
      )}

      <div className="g-block" {...part('where')}>
        <span className="inv-eyebrow">Where</span>
        <Venue w={w} />
      </div>

      {w.dressNote && (
        <div className="g-block" {...part('dress')}>
          <span className="inv-eyebrow">Dress code</span>
          <span>{w.dressNote}</span>
        </div>
      )}

      {w.message && (
        <blockquote className="inv-quote" {...part('message')}>
          {w.message}
        </blockquote>
      )}

      <Events events={w.events} part={part} id={ctx.id} title="The celebrations" />

      {w.rsvpDeadline && (
        <p className="g-rsvp" {...part('rsvp')}>
          Kindly reply by {formatDate(w.rsvpDeadline)}
        </p>
      )}
    </div>
  )
}

/* ── Deco: stepped corners and a sunburst ───────────────────────────── */

function DecoCorners() {
  return (
    <>
      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <svg key={c} className={`inv-ornament d-corner d-corner--${c}`} viewBox="0 0 40 40" aria-hidden="true">
          <path d="M1 39V1h38M7 30V7h23M13 22V13h9" />
          <path d="M20 20l3 3-3 3-3-3z" />
        </svg>
      ))}
    </>
  )
}

/** A stepped diamond, the corners' motif in small. */
function DecoMark() {
  return (
    <svg className="inv-ornament" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1l7 7-7 7-7-7zM8 5l3 3-3 3-3-3z" />
    </svg>
  )
}

function Sunburst() {
  const rays = Array.from({ length: 11 }, (_, i) => (Math.PI * (i + 1)) / 12)
  return (
    <svg className="inv-ornament d-sun" viewBox="0 0 120 64" aria-hidden="true">
      <path d="M44 62a16 16 0 0 1 32 0M36 62a24 24 0 0 1 48 0" />
      {rays.map((a) => (
        <path
          key={a}
          d={`M${(60 - Math.cos(a) * 28).toFixed(1)} ${(62 - Math.sin(a) * 28).toFixed(1)}L${(60 - Math.cos(a) * 58).toFixed(1)} ${(62 - Math.sin(a) * 58).toFixed(1)}`}
        />
      ))}
      <path d="M2 62h116" />
    </svg>
  )
}

function Deco(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = familiesOf(w)

  return (
    <div className="d-frame">
      <DecoCorners />
      <Sunburst />

      {families.any && (
        <div className="d-block" {...part('families')}>
          <p className="inv-eyebrow">Together with their families</p>
          {families.sides.length ? (
            <Parents sides={families.sides} className="d-parents" and="&" mark={<DecoMark />} />
          ) : (
            <p className="d-families">{families.legacy.join(' & ')}</p>
          )}
        </div>
      )}

      <p className="d-invite">request the honour of your presence at the marriage of</p>
      <Names {...ctx} />

      {date && (
        <div className="d-date" {...part('when')}>
          <span>{date.weekday}</span>
          <span className="d-date-main">
            {date.day} {date.month} {date.year}
          </span>
          <span>{w.startTime ? formatTime(w.startTime) : date.year}</span>
        </div>
      )}

      <div className="d-block" {...part('where')}>
        <span className="inv-eyebrow">Venue</span>
        <Venue w={w} />
      </div>

      {w.dressNote && (
        <div className="d-block" {...part('dress')}>
          <span className="inv-eyebrow">Dress code</span>
          <span>{w.dressNote}</span>
        </div>
      )}

      {w.message && (
        <blockquote className="inv-quote" {...part('message')}>
          {w.message}
        </blockquote>
      )}

      <Events events={w.events} part={part} id={ctx.id} title="The celebrations" />

      {w.rsvpDeadline && (
        <p className="d-rsvp" {...part('rsvp')}>
          Reply by {formatDate(w.rsvpDeadline)}
        </p>
      )}
    </div>
  )
}

/* ── Adire: indigo-cloth bands and a date stamp ─────────────────────── */

function Adire(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = familiesOf(w)

  return (
    <div className="a-layout">
      <span className="a-band" aria-hidden="true" />
      <div className="a-body">
        {families.any ? (
          <div {...part('families')}>
            <p className="inv-eyebrow">Together with their families</p>
            {families.sides.length ? (
              <Parents sides={families.sides} className="a-parents" mark={false} />
            ) : (
              <p className="a-families">{families.legacy.join(' & ')}</p>
            )}
          </div>
        ) : (
          <p className="inv-eyebrow">You are invited to the wedding of</p>
        )}

        <Names {...ctx} />
        <p className="a-invite">and would love you to celebrate with them</p>

        {date && (
          <div className="a-stamp" {...part('when')}>
            <span className="a-stamp-small">{date.weekday}</span>
            <span className="a-stamp-day">{date.day}</span>
            <span className="a-stamp-small">
              {date.month} {date.year}
            </span>
            {w.startTime && <span className="a-stamp-small">{formatTime(w.startTime)}</span>}
          </div>
        )}

        <dl className="a-details">
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
          <p className="a-message" {...part('message')}>
            {w.message}
          </p>
        )}

        <Events events={w.events} part={part} id={ctx.id} title="The celebrations" />
      </div>
      <span className="a-band" aria-hidden="true" />
    </div>
  )
}

/* ── Minimal: quiet type and two columns ────────────────────────────── */

function Minimal(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = familiesOf(w)
  const city = cityOf(w.venueAddress)

  return (
    <div className="n-layout">
      <div className="n-top" aria-hidden="true">
        <span>{date?.numeric}</span>
        <span>{city}</span>
      </div>

      <div>
        <p className="n-kicker">The wedding of</p>
        <Names {...ctx} />
      </div>

      <dl className="n-details">
        {date && (
          <div {...part('when')}>
            <dt>When</dt>
            <dd>
              {date.weekday} {date.day} {date.month} {date.year}
              {w.startTime && <span className="inv-sub">{formatTime(w.startTime)}</span>}
            </dd>
          </div>
        )}
        <div {...part('where')}>
          <dt>Where</dt>
          <dd>
            <Venue w={w} />
          </dd>
        </div>
        {families.any && (
          <div className={families.sides.length ? 'n-hosts' : undefined} {...part('families')}>
            <dt>Hosted by</dt>
            <dd>
              {families.sides.length ? (
                <Parents sides={families.sides} className="n-parents" and="&" mark={false} />
              ) : (
                families.legacy.map((f) => (
                  <span key={f} className="inv-sub">{f}</span>
                ))
              )}
            </dd>
          </div>
        )}
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
        <p className="n-message" {...part('message')}>
          {w.message}
        </p>
      )}

      <Events events={w.events} part={part} id={ctx.id} title="Also celebrating" />
    </div>
  )
}

/* ── Poster: a block of colour and giant numerals ───────────────────── */

function Poster(ctx: Ctx) {
  const { w, part } = ctx
  const date = dateParts(w.date)
  const families = familiesOf(w)

  return (
    <div className="p-layout">
      <header className="p-hero">
        <p className="p-kicker">We’re getting married</p>
        <Names {...ctx} />
      </header>

      {date && (
        <div className="p-date" {...part('when')}>
          <span className="p-big">{date.day.padStart(2, '0')}</span>
          <span className="p-mid">
            {date.weekday}
            <br />
            {date.month}
            {w.startTime && (
              <>
                <br />
                {formatTime(w.startTime)}
              </>
            )}
          </span>
          <span className="p-big">{date.year}</span>
        </div>
      )}

      <dl className="p-grid">
        <div {...part('where')}>
          <dt>Where</dt>
          <dd>
            <Venue w={w} />
          </dd>
        </div>
        {families.any && (
          <div className={families.sides.length ? 'p-hosts' : undefined} {...part('families')}>
            <dt>Hosted by</dt>
            <dd>
              {families.sides.length ? (
                <Parents sides={families.sides} className="p-parents" mark={false} />
              ) : (
                families.legacy.map((f) => (
                  <span key={f} className="inv-sub">{f}</span>
                ))
              )}
            </dd>
          </div>
        )}
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
        <p className="p-message" {...part('message')}>
          {w.message}
        </p>
      )}

      <Events events={w.events} part={part} id={ctx.id} title="Programme" />
    </div>
  )
}
