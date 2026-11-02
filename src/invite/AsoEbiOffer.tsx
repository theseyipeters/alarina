import { useState, type FormEvent } from 'react'
import Field from '../components/Field.tsx'
import { api } from '../lib/api.ts'
import { MAX_QUANTITY, quantityLabel } from '../lib/asoEbi.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira, grossUp } from '../lib/money.ts'
import type { AsoEbiItem } from '../lib/types.ts'

type Props = {
  slug: string
  names: string
  items: AsoEbiItem[]
  /** Prefilled from the guest's RSVP when we have it. */
  guest?: { name?: string; email?: string; phone?: string }
  rsvpToken?: string
}

/**
 * Aso-ebi after replying. The guest picks an item and a quantity; the couple receive exactly the
 * price, Paystack's fee is shown and added on top, then they continue to Paystack's checkout.
 */
export default function AsoEbiOffer({ slug, names, items, guest, rsvpToken }: Props) {
  const [itemId, setItemId] = useState(items[0]!.id)
  const [quantity, setQuantity] = useState('1')
  const [name, setName] = useState(guest?.name ?? '')
  const [email, setEmail] = useState(guest?.email ?? '')
  const [phone, setPhone] = useState(guest?.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const item = items.find((i) => i.id === itemId) ?? items[0]!
  const count = Number(quantity)
  const valid = Number.isInteger(count) && count >= 1 && count <= MAX_QUANTITY
  const total = valid ? item.price * count : 0
  const quote = valid ? grossUp(total) : null

  async function pay(e: FormEvent) {
    e.preventDefault()
    if (!valid) {
      setError(`Choose a quantity from 1 to ${MAX_QUANTITY}.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>(
        `/public/invitations/${encodeURIComponent(slug)}/aso-ebi`,
        { itemId: item.id, quantity: count, name, email, phone, ...(rsvpToken && { rsvpToken }) },
      )
      window.location.assign(checkoutUrl)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <section className="gift-offer" aria-labelledby="aso-ebi-title">
      <h3 id="aso-ebi-title" className="gift-offer-title">Order aso-ebi</h3>
      <p className="muted">The material for {names}’s wedding, at the price they’ve set.</p>

      <form onSubmit={pay}>
        {items.length > 1 && (
          <fieldset className="amount-chips">
            <legend className="visually-hidden">Material</legend>
            {items.map((i) => (
              <label key={i.id} className="amount-chip">
                <input type="radio" name="aso-ebi-item" checked={i.id === item.id} onChange={() => setItemId(i.id)} />
                {i.name}
              </label>
            ))}
          </fieldset>
        )}

        <p className="aso-ebi-item">
          {item.name}
          <span className="hint">{formatNaira(item.price)} per {item.unit}</span>
          {item.description && <span className="hint">{item.description}</span>}
        </p>

        <Field label={`How many ${item.unit}s`}>
          {(p) => (
            <input
              {...p}
              type="text"
              inputMode="numeric"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
            />
          )}
        </Field>

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
        {!guest?.phone && (
          <Field label="Phone" hint={`So ${names} can reach you about your order.`}>
            {(p) => <input {...p} type="tel" autoComplete="tel" required placeholder="0803 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
        )}

        {quote && (
          <dl className="gift-breakdown" aria-live="polite">
            <div>
              <dt>{quantityLabel(count, item.unit)} of {item.name}</dt>
              <dd>{formatNaira(total)}</dd>
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
