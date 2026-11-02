import { useState, type FormEvent } from 'react'
import Field from '../components/Field.tsx'
import { api } from '../lib/api.ts'
import { MAX_QUANTITY, quantityLabel } from '../lib/asoEbi.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira, grossUp, MAX_GIFT_NAIRA, MIN_GIFT_NAIRA } from '../lib/money.ts'
import type { PublicInvitation } from '../lib/types.ts'

const PRESETS = [5_000, 10_000, 20_000, 50_000]

type Props = {
  invitation: PublicInvitation
  names: string
  /** Prefilled from the guest's RSVP when we have it. */
  guest?: { name?: string; email?: string; phone?: string }
  rsvpToken?: string
}

/**
 * Everything a guest can give, on one page: a cash gift and/or aso-ebi, in any mix. The running
 * total sticks to the bottom, and the whole basket is paid in one Paystack checkout so the guest
 * pays the fee once and the couple receive exactly the sum of what was chosen.
 */
export default function GiftBasket({ invitation, names, guest, rsvpToken }: Props) {
  const items = invitation.asoEbi
  const [cash, setCash] = useState<number | 'other' | null>(null)
  const [other, setOther] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [name, setName] = useState(guest?.name ?? '')
  const [email, setEmail] = useState(guest?.email ?? '')
  const [phone, setPhone] = useState(guest?.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cashNaira = cash === 'other' ? Number(other) || 0 : (cash ?? 0)
  const cashValid = Number.isInteger(cashNaira) && cashNaira >= MIN_GIFT_NAIRA && cashNaira <= MAX_GIFT_NAIRA
  const chosenItems = items.filter((i) => (quantities[i.id] ?? 0) > 0)

  // What the couple receive, in kobo: the sum of every line in the basket.
  const lines = [
    ...(cash !== null && cashValid ? [{ key: 'cash', label: 'Cash gift', amount: cashNaira * 100 }] : []),
    ...chosenItems.map((i) => ({
      key: i.id,
      label: `${quantityLabel(quantities[i.id]!, i.unit)} of ${i.name}`,
      amount: i.price * quantities[i.id]!,
    })),
  ]
  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  const quote = total > 0 ? grossUp(total) : null

  const setQuantity = (id: string, quantity: number) =>
    setQuantities((q) => ({ ...q, [id]: Math.min(MAX_QUANTITY, Math.max(0, quantity)) }))

  async function pay(e: FormEvent) {
    e.preventDefault()
    if (cash === 'other' && !cashValid) {
      setError(`Choose a cash amount between ${formatNaira(MIN_GIFT_NAIRA * 100)} and ${formatNaira(MAX_GIFT_NAIRA * 100)}.`)
      return
    }
    if (lines.length === 0) {
      setError('Choose something to give first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>(
        `/public/invitations/${encodeURIComponent(invitation.slug)}/checkout`,
        {
          ...(cash !== null && cashValid && { cash: cashNaira }),
          ...(chosenItems.length > 0 && {
            asoEbi: chosenItems.map((i) => ({ itemId: i.id, quantity: quantities[i.id] })),
            phone,
          }),
          name,
          email,
          ...(rsvpToken && { rsvpToken }),
        },
      )
      window.location.assign(checkoutUrl)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  if (!invitation.giftsEnabled && items.length === 0) return null

  return (
    <section className="gift-offer" aria-labelledby="gift-title">
      <h3 id="gift-title" className="gift-offer-title">Send a gift</h3>
      <p className="muted">Give as much or as little as you like. {names} receive every naira you choose.</p>

      <form onSubmit={pay}>
        {invitation.giftsEnabled && (
          <fieldset className="basket-section">
            <legend>Cash gift</legend>
            <div className="amount-chips">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="amount-chip"
                  aria-pressed={cash === p}
                  onClick={() => setCash(cash === p ? null : p)}
                >
                  {formatNaira(p * 100)}
                </button>
              ))}
              <button
                type="button"
                className="amount-chip"
                aria-pressed={cash === 'other'}
                onClick={() => setCash(cash === 'other' ? null : 'other')}
              >
                Other
              </button>
            </div>
            {cash === 'other' && (
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
          </fieldset>
        )}

        {items.length > 0 && (
          <fieldset className="basket-section">
            <legend>Aso-ebi</legend>
            <p className="hint">The material for the wedding, at the price {names} have set.</p>
            <ul className="basket-items">
              {items.map((i) => {
                const quantity = quantities[i.id] ?? 0
                return (
                  <li key={i.id}>
                    <span className="basket-item-name">
                      {i.name}
                      <span className="hint">{formatNaira(i.price)} per {i.unit}</span>
                      {i.description && <span className="hint">{i.description}</span>}
                    </span>
                    <span className="stepper" role="group" aria-label={i.name}>
                      <button
                        type="button"
                        className="stepper-button"
                        aria-label={`Fewer ${i.name}`}
                        disabled={quantity === 0}
                        onClick={() => setQuantity(i.id, quantity - 1)}
                      >
                        −
                      </button>
                      <output aria-label={`${i.name} quantity`}>{quantity}</output>
                      <button
                        type="button"
                        className="stepper-button"
                        aria-label={`More ${i.name}`}
                        disabled={quantity >= MAX_QUANTITY}
                        onClick={() => setQuantity(i.id, quantity + 1)}
                      >
                        +
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>
          </fieldset>
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
        {!guest?.phone && chosenItems.length > 0 && (
          <Field label="Phone" hint={`So ${names} can reach you about your aso-ebi.`}>
            {(p) => <input {...p} type="tel" autoComplete="tel" required placeholder="0803 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
        )}

        <div aria-live="polite">
          {quote ? (
            <dl className="gift-breakdown">
              {lines.map((l) => (
                <div key={l.key}>
                  <dt>{l.label}</dt>
                  <dd>{formatNaira(l.amount)}</dd>
                </div>
              ))}
              <div>
                <dt>Paystack fee</dt>
                <dd>{formatNaira(quote.fee)}</dd>
              </div>
              <div className="gift-breakdown-total">
                <dt>You pay</dt>
                <dd>{formatNaira(quote.charge)}</dd>
              </div>
            </dl>
          ) : (
            <p className="hint basket-empty">Choose what you’d like to give. You can mix cash and aso-ebi.</p>
          )}
        </div>

        {/* Only the button sticks to the bottom, so the total is always one tap from paying. */}
        <div className="basket-bar">
          {error && <p role="alert" className="alert">{error}</p>}
          <button className="btn btn--block" disabled={busy}>
            {busy ? 'Opening Paystack…' : quote ? `Pay ${formatNaira(quote.charge)}` : 'Continue to payment'}
          </button>
        </div>
        <p className="hint gift-note">Secure payment by Paystack. Your RSVP is already saved, whatever you decide.</p>
      </form>
    </section>
  )
}
