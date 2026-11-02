import { coupleNames, formatDate } from '../lib/format.ts'
import type { InvitationContent } from '../lib/types.ts'

export const OPEN_MS = 2400

type Props = { invitation: Pick<InvitationContent, 'partnerOneName' | 'partnerTwoName' | 'date'>; opening: boolean; onOpen: () => void }

/**
 * The first thing a guest sees: a sealed envelope in the invitation's own colours, sealed with
 * the couple's initials. Opening it plays once, then the full invitation takes over.
 */
export default function EnvelopeIntro({ invitation: w, opening, onOpen }: Props) {
  const names = coupleNames(w.partnerOneName, w.partnerTwoName)
  const seal = [w.partnerOneName, w.partnerTwoName].map((n) => n?.normalize('NFC').trim()[0] ?? '').join('')

  return (
    <section className={opening ? 'intro is-opening' : 'intro'} aria-labelledby="intro-title">
      <p className="inv-eyebrow">You’re invited</p>
      <h1 id="intro-title" className="intro-names">{names}</h1>
      <p className="intro-date">{formatDate(w.date)}</p>

      {/* The envelope is a large tap target; keyboard users get the button below instead. */}
      <button
        type="button"
        className="intro-envelope"
        onClick={onOpen}
        disabled={opening}
        tabIndex={-1}
        aria-label="Open your invitation"
      >
        <span className="intro-back" />
        <span className="intro-card" aria-hidden="true">
          <span className="intro-card-names">{names}</span>
        </span>
        <span className="intro-pocket" aria-hidden="true" />
        <span className="intro-flap" aria-hidden="true">
          <span className="intro-seal">{seal}</span>
        </span>
      </button>

      <button type="button" className="btn intro-open" onClick={onOpen} disabled={opening}>
        {opening ? 'Opening…' : 'Open invitation'}
      </button>
    </section>
  )
}
