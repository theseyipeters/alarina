import { useState, type FormEvent } from 'react'
import AmountInput from '../components/AmountInput.tsx'
import Field from '../components/Field.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatDate } from '../lib/format.ts'
import { formatNaira, nairaInput } from '../lib/money.ts'
import type { Booking, PlanningRole } from './types.ts'
import { useLoad } from './useLoad.ts'
import { LoadError, Loading } from '../components/States.tsx'

type Props = { weddingId: string; bookingId: string; role: PlanningRole; onChange: () => void }

/**
 * One booking, as the couple and their planners see it: the conversation with the vendor, the
 * quote, and paying. Only the couple accepts a quote or pays; the main planner can write.
 */
export default function BookingDetail({ weddingId, bookingId, role, onChange }: Props) {
  const base = `/planning/${weddingId}/bookings/${bookingId}`
  const [state, reload] = useLoad<{ booking: Booking }>(base)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (state.status === 'loading') return <Loading label="Loading the booking" />
  if (state.status === 'error') return <LoadError compact title="This booking didn’t load" message={state.message} onRetry={state.notFound ? undefined : reload} />
  const b = state.data.booking
  const canWrite = role !== 'co' && b.status !== 'cancelled'

  async function act(path: string, body?: unknown) {
    setBusy(true)
    setError(null)
    try {
      await api.post(`${base}/${path}`, body)
      await reload()
      onChange()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="booking">
      {error && <p role="alert" className="alert">{error}</p>}
      <Thread booking={b} canWrite={canWrite} onSend={(body) => act('messages', { body })} busy={busy} />

      {b.quote && (
        <div className="quote">
          <h4>Quote{b.quote.validUntil && <span className="hint"> · valid until {formatDate(b.quote.validUntil)}</span>}</h4>
          <ul className="quote-lines">
            {b.quote.lines.map((l, i) => (
              <li key={i}>
                <span>{l.name}</span>
                <span>{formatNaira(l.amount)}</span>
              </li>
            ))}
            <li className="quote-total">
              <span>Total</span>
              <span>{formatNaira(b.quote.total)}</span>
            </li>
          </ul>
          {b.quote.deposit !== null && <p className="hint">Deposit to secure the booking: {formatNaira(b.quote.deposit)}</p>}
          {b.quote.note && <p className="muted">{b.quote.note}</p>}
        </div>
      )}

      {b.status === 'quoted' && role === 'couple' && (
        <button type="button" className="btn" onClick={() => act('accept')} disabled={busy}>
          Accept quote
        </button>
      )}
      {b.status === 'quoted' && role !== 'couple' && <p className="hint">The couple accepts quotes.</p>}

      {b.status === 'accepted' && (
        <Payments booking={b} weddingId={weddingId} canPay={role === 'couple'} />
      )}

      {b.status === 'cancelled' ? (
        <p className="muted">Cancelled by the {b.cancelledBy === 'vendor' ? 'vendor' : 'couple'}.</p>
      ) : (
        canWrite &&
        b.paid === 0 && (
          <button type="button" className="link-button link-button--danger" onClick={() => act('cancel')} disabled={busy}>
            Cancel this booking
          </button>
        )
      )}
    </div>
  )
}

export function Thread({ booking, canWrite, onSend, busy }: { booking: Booking; canWrite: boolean; onSend: (body: string) => Promise<void>; busy: boolean }) {
  const [body, setBody] = useState('')

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    await onSend(body.trim())
    setBody('')
  }

  return (
    <div className="thread">
      <ol className="thread-messages">
        {booking.messages.map((m, i) => (
          <li key={i} className={`thread-message thread-message--${m.from}`}>
            <span className="hint">
              {m.authorName} · {new Date(m.at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
            </span>
            <p>{m.body}</p>
          </li>
        ))}
      </ol>
      {canWrite && (
        <form onSubmit={send} className="thread-reply">
          <Field label="Reply">
            {(p) => <textarea {...p} rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />}
          </Field>
          <button className="btn btn--secondary" disabled={busy || !body.trim()}>Send</button>
        </form>
      )}
    </div>
  )
}

function Payments({ booking, weddingId, canPay }: { booking: Booking; weddingId: string; canPay: boolean }) {
  // The first payment suggests the deposit, then whatever is left.
  const suggested = booking.paid === 0 && booking.quote?.deposit ? booking.quote.deposit : booking.balance
  const [amount, setAmount] = useState(nairaInput(suggested))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pay(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>(`/planning/${weddingId}/bookings/${booking.id}/pay`, { amount: Number(amount) })
      // Paystack's own page; it sends the couple back to /app/vendors to confirm.
      window.location.assign(checkoutUrl)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="booking-payments">
      <p>
        <strong>{formatNaira(booking.paid)}</strong> paid of {formatNaira(booking.quote?.total ?? 0)}
        {booking.balance > 0 ? ` · ${formatNaira(booking.balance)} to go` : ' · fully paid'}
      </p>
      <progress className="meter" value={booking.paid} max={booking.quote?.total ?? 1} aria-label="Paid so far" />
      {booking.payments && booking.payments.filter((p) => p.status === 'success').length > 0 && (
        <ul className="hint">
          {booking.payments
            .filter((p) => p.status === 'success')
            .map((p) => (
              <li key={p.id}>
                {formatNaira(p.amount)} {p.paidAt && `on ${new Date(p.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </li>
            ))}
        </ul>
      )}
      {error && <p role="alert" className="alert">{error}</p>}
      {booking.balance > 0 &&
        (canPay ? (
          booking.payable ? (
            <form onSubmit={pay} className="row row--tight">
              <Field label="Pay now" hint={`Up to ${formatNaira(booking.balance)}. Paystack’s fee is added on top, so the vendor receives the full amount.`}>
                {(p) => <AmountInput {...p} min={1} max={Math.floor(booking.balance / 100)} required value={amount} onChange={setAmount} />}
              </Field>
              <button className="btn" disabled={busy}>{busy ? 'Opening Paystack…' : 'Pay'}</button>
            </form>
          ) : (
            <p className="hint">This vendor can’t be paid in the app right now. Pay them directly and record it on your budget.</p>
          )
        ) : (
          <p className="hint">The couple makes payments.</p>
        ))}
    </div>
  )
}
