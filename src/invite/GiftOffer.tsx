import { useState, type FormEvent } from 'react'
import Field from '../components/Field.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira, grossUp, MAX_GIFT_NAIRA, MIN_GIFT_NAIRA } from '../lib/money.ts'

const PRESETS = [5_000, 10_000, 20_000, 50_000]

type Props = {
  slug: string
  names: string
  /** Prefilled from the guest's RSVP when we have it. */
  guest?: { name?: string; email?: string }
  rsvpToken?: string
}

/**
 * Optional cash gift after replying. The guest picks what the couple receives; Paystack's fee is
 * shown and added on top, then they continue to Paystack's checkout.
 */
export default function GiftOffer({ slug, names, guest, rsvpToken }: Props) {
  const [choice, setChoice] = useState<number | 'other'>(10_000)
  const [other, setOther] = useState('')
  const [name, setName] = useState(guest?.name ?? '')
  const [email, setEmail] = useState(guest?.email ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amount = choice === 'other' ? Number(other) || 0 : choice
  const valid = Number.isInteger(amount) && amount >= MIN_GIFT_NAIRA && amount <= MAX_GIFT_NAIRA
  const quote = valid ? grossUp(amount * 100) : null

  async function pay(e: FormEvent) {
    e.preventDefault()
    if (!valid) {
      setError(`Choose an amount between ${formatNaira(MIN_GIFT_NAIRA * 100)} and ${formatNaira(MAX_GIFT_NAIRA * 100)}.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>(`/public/invitations/${encodeURIComponent(slug)}/gifts`, {
        amount,
        name,
        email,
        ...(rsvpToken && { rsvpToken }),
      })
      window.location.assign(checkoutUrl)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <section className="gift-offer" aria-labelledby="gift-title">
      <h3 id="gift-title" className="gift-offer-title">Send a gift</h3>
      <p className="muted">Optional. {names} receive the full amount you choose.</p>

      <form onSubmit={pay}>
        <fieldset className="amount-chips">
          <legend className="visually-hidden">Gift amount</legend>
          {PRESETS.map((p) => (
            <label key={p} className="amount-chip">
              <input type="radio" name="gift-amount" checked={choice === p} onChange={() => setChoice(p)} />
              {formatNaira(p * 100)}
            </label>
          ))}
          <label className="amount-chip">
            <input type="radio" name="gift-amount" checked={choice === 'other'} onChange={() => setChoice('other')} />
            Other
          </label>
        </fieldset>

        {choice === 'other' && (
          <Field label="Amount in naira" hint={`From ${formatNaira(MIN_GIFT_NAIRA * 100)}.`}>
            {(p) => (
              <input
                {...p}
                type="text"
                inputMode="numeric"
                placeholder="15000"
                value={other}
                onChange={(e) => setOther(e.target.value.replace(/\D/g, ''))}
              />
            )}
          </Field>
        )}

        {!guest?.name && (
          <Field label="Your name">
            {(p) => <input {...p} type="text" autoComplete="name" required maxLength={80} placeholder="Chidi Okeke" value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
        )}
        {!guest?.email && (
          <Field label="Email" hint="Paystack sends your receipt here.">
            {(p) => <input {...p} type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
        )}

        {quote && (
          <dl className="gift-breakdown" aria-live="polite">
            <div>
              <dt>{names} receive</dt>
              <dd>{formatNaira(amount * 100)}</dd>
            </div>
            <div>
              <dt>Paystack fee</dt>
              <dd>{formatNaira(quote.fee)}</dd>
            </div>
            <div className="gift-breakdown-total">
              <dt>You pay</dt>
              <dd>{formatNaira(quote.charge)}</dd>
            </div>
          </dl>
        )}

        {error && <p role="alert" className="alert">{error}</p>}
        <button className="btn btn--block" disabled={busy}>
          {busy ? 'Opening Paystack…' : quote ? `Pay ${formatNaira(quote.charge)}` : 'Continue to payment'}
        </button>
        <p className="hint gift-note">Secure payment by Paystack. Your RSVP is already saved, whatever you decide.</p>
      </form>
    </section>
  )
}
