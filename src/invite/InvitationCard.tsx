import { formatDate, formatTime } from '../lib/format.ts'
import type { InvitationContent } from '../lib/types.ts'
import { elorienCanRender } from './design.ts'

const mapLink = (...parts: (string | null)[]) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.filter(Boolean).join(', '))}`

/** The invitation itself. Layout and colours come from data-template / data-palette on an ancestor. */
export default function InvitationCard({ invitation }: { invitation: InvitationContent }) {
  const w = invitation
  const families = [w.partnerOneFamily, w.partnerTwoFamily].filter(Boolean)
  const events = w.events.filter((e) => e.name.trim())

  // Modern sets the names in Elorien only when it can draw every character of both, so the
  // couple's names always match; otherwise both stay in the fallback serif.
  const names = `${w.partnerOneName ?? ''}${w.partnerTwoName ?? ''}`
  const nameClass = w.template === 'modern' && elorienCanRender(names) ? 'inv-display--elorien' : undefined

  return (
    <article className="inv-card" aria-labelledby="inv-names">
      {families.length > 0 && (
        <>
          <p className="inv-eyebrow">Together with their families</p>
          <p className="inv-families">
            {families.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </p>
        </>
      )}

      <p className="inv-eyebrow">You’re invited to the wedding of</p>
      <h1 id="inv-names" className="inv-names">
        <span className={nameClass}>{w.partnerOneName}</span>
        <span className="inv-amp">&amp;</span>
        <span className={nameClass}>{w.partnerTwoName}</span>
      </h1>

      <hr className="inv-rule" />

      <dl className="inv-details">
        <div>
          <dt>When</dt>
          <dd>
            {formatDate(w.date)}
            {w.startTime && <span className="inv-sub">{formatTime(w.startTime)}</span>}
          </dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>
            {w.venueName}
            {w.venueAddress && <span className="inv-sub">{w.venueAddress}</span>}
            {w.venueName && (
              <span className="inv-sub">
                <a href={mapLink(w.venueName, w.venueAddress)} target="_blank" rel="noopener noreferrer">
                  Open in Maps<span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </span>
            )}
          </dd>
        </div>
        {w.dressNote && (
          <div>
            <dt>Dress code</dt>
            <dd>{w.dressNote}</dd>
          </div>
        )}
        {w.rsvpDeadline && (
          <div>
            <dt>Kindly reply by</dt>
            <dd>{formatDate(w.rsvpDeadline)}</dd>
          </div>
        )}
      </dl>

      {w.message && <p className="inv-message">{w.message}</p>}

      {events.length > 0 && (
        <section aria-labelledby="inv-events">
          <h2 id="inv-events" className="inv-section-title">Also celebrating</h2>
          <ul className="inv-events">
            {events.map((e) => (
              <li key={e.id}>
                {e.name}
                {(e.date || e.startTime) && (
                  <span className="inv-sub muted">
                    {[formatDate(e.date), formatTime(e.startTime)].filter(Boolean).join(' · ')}
                  </span>
                )}
                {e.venueName && (
                  <span className="inv-sub muted">{[e.venueName, e.venueAddress].filter(Boolean).join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
