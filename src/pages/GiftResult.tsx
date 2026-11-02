import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import GiftBasket from '../invite/GiftBasket.tsx'
import '../invite/styles.ts'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { coupleNames } from '../lib/format.ts'
import { quantityLabel } from '../lib/asoEbi.ts'
import { formatNaira } from '../lib/money.ts'
import type { GiftStatus, PublicInvitation } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type Result = {
  gift: {
    status: GiftStatus
    amount: number
    guestName: string
    lines: { kind: 'cash' | 'aso_ebi'; amount: number; itemName: string | null; unit: string | null; quantity: number | null }[]
  }
  invitation: PublicInvitation | null
}
type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; result: Result }

/** Where Paystack sends the guest back. Confirms the payment, themed like the invitation. */
export default function GiftResult() {
  useTitle('Your gift')
  const { slug = '' } = useParams()
  const reference = useSearchParams()[0].get('reference')
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!reference) return
    let cancelled = false
    api.get<Result>(`/public/gifts/${encodeURIComponent(reference)}`).then(
      (result) => !cancelled && setState({ status: 'ready', result }),
      (err) => !cancelled && setState({ status: 'error', message: errorMessage(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [reference, attempt])

  if (!reference) {
    return (
      <main id="main" className="page">
        <div className="card">
          <h1>Gift not found</h1>
          <p className="muted">This page needs a payment reference. <Link to={`/invite/${slug}`}>Back to the invitation</Link></p>
        </div>
      </main>
    )
  }
  if (state.status === 'loading') return <p className="page muted">Confirming your payment…</p>
  if (state.status === 'error') {
    return (
      <main id="main" className="page">
        <div className="card">
          <h1>We couldn’t confirm this gift</h1>
          <p className="muted">{state.message}</p>
        </div>
      </main>
    )
  }

  const { gift, invitation } = state.result
  const retry = invitation && (invitation.giftsEnabled || invitation.asoEbi.length > 0)
  const names = invitation ? coupleNames(invitation.partnerOneName, invitation.partnerTwoName) : 'the couple'
  const firstName = gift.guestName.trim().split(/\s+/)[0]
  const back = `/invite/${slug}`

  return (
    <div className="inv" data-palette={invitation?.palette ?? 'ivory'} data-template={invitation?.template ?? 'classic'}>
      <main id="main" className="inv-column">
        <section className="inv-panel rsvp-done" aria-labelledby="gift-result-title">
          {gift.status === 'success' && (
            <>
              <svg className="rsvp-check" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" />
                <path d="M15 27l7 7 15-16" />
              </svg>
              <h1 id="gift-result-title" className="gift-result-title">Thank you, {firstName}</h1>
              <p>
                {formatNaira(gift.amount)} is on its way to {names}. Paystack has emailed you a receipt.
              </p>
              <ul className="gift-result-lines">
                {gift.lines.map((l, i) => (
                  <li key={i}>
                    {l.kind === 'cash' ? 'Cash gift' : `${quantityLabel(l.quantity ?? 0, l.unit ?? '')} of ${l.itemName}`}
                    <span>{formatNaira(l.amount)}</span>
                  </li>
                ))}
              </ul>
              {gift.lines.some((l) => l.kind === 'aso_ebi') && (
                <p className="muted">{names} will see your name and phone number so they can reach you about your aso-ebi.</p>
              )}
            </>
          )}
          {gift.status === 'pending' && (
            <>
              <h1 id="gift-result-title" className="gift-result-title">Confirming your payment</h1>
              <p className="muted">Paystack hasn’t confirmed it yet. This usually takes a few seconds.</p>
              <button type="button" className="btn btn--secondary" onClick={() => setAttempt((a) => a + 1)}>Check again</button>
            </>
          )}
          {(gift.status === 'failed' || gift.status === 'abandoned') && (
            <>
              <h1 id="gift-result-title" className="gift-result-title">Your payment didn’t go through</h1>
              <p className="muted">
                {gift.status === 'abandoned' ? 'The payment was cancelled.' : 'Paystack couldn’t complete it.'} Your RSVP is
                safe. You can try again below.
              </p>
            </>
          )}
          <p>
            <Link to={back}>Back to the invitation</Link>
          </p>
        </section>

        {(gift.status === 'failed' || gift.status === 'abandoned') && retry && (
          <section className="inv-panel">
            <GiftBasket invitation={invitation} names={names} guest={{ name: gift.guestName }} />
          </section>
        )}
      </main>
    </div>
  )
}
