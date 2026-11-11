import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import DatePicker from '../../components/DatePicker.tsx'
import AmountInput from '../../components/AmountInput.tsx'
import Field from '../../components/Field.tsx'
import { api } from '../../lib/api.ts'
import { errorMessage } from '../../lib/errors.ts'
import { formatDate, todayInLagos } from '../../lib/format.ts'
import { formatNaira, nairaInput } from '../../lib/money.ts'
import { useTitle } from '../../lib/useTitle.ts'
import { Thread } from '../../planning/BookingDetail.tsx'
import type { Booking, BookingStatus } from '../../planning/types.ts'
import { useLoad } from '../../planning/useLoad.ts'
import '../../planning/planning.css'
import '../Gifts.css'
import { EmptyState, LoadError, Loading } from '../../components/States.tsx'

const STATUS: Record<BookingStatus, string> = { enquiry: 'New enquiry', quoted: 'Quoted', accepted: 'Booked', cancelled: 'Cancelled' }

/** A vendor's enquiries and bookings from couples, newest activity first. */
export default function Enquiries() {
  useTitle('Enquiries')
  const { id } = useParams()
  const [state, reload] = useLoad<{ bookings: Booking[] }>('/vendor/bookings')

  if (id) return <EnquiryDetail id={id} onChange={reload} />
  if (state.status === 'loading') return <Loading label="Loading enquiries" />
  if (state.status === 'error') return <LoadError title="Your enquiries didn’t load" message={state.message} onRetry={reload} />
  const bookings = state.data.bookings

  return (
    <section className="card" aria-labelledby="enquiries-title" data-tour="vendor-enquiries">
      <h2 id="enquiries-title">Enquiries and bookings</h2>
      {bookings.length === 0 ? (
        <EmptyState icon="envelope" title="No enquiries yet" action={<Link to="/vendor">Check your listing</Link>}>
          When a couple adds you to their wedding and writes to you, the conversation starts here. A complete listing with packages and photos gets more of them.
        </EmptyState>
      ) : (
        <ul className="item-list">
          {bookings.map((b) => (
            <li key={b.id}>
              <span className="gift-name">
                <Link to={`/vendor/enquiries/${b.id}`}>{b.couple?.names ?? 'A couple'}</Link>
                <span className="hint">
                  {[b.couple?.date && formatDate(b.couple.date), b.couple?.venueName, b.packageName].filter(Boolean).join(' · ')}
                </span>
                {b.quote && (
                  <span className="hint">
                    {formatNaira(b.paid)} paid of {formatNaira(b.quote.total)}
                  </span>
                )}
              </span>
              <span className={b.status === 'enquiry' ? 'badge badge--warn' : b.status === 'accepted' ? 'badge badge--live' : 'badge'}>{STATUS[b.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EnquiryDetail({ id, onChange }: { id: string; onChange: () => void }) {
  const base = `/vendor/bookings/${id}`
  const [state, reload] = useLoad<{ booking: Booking }>(base)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (state.status === 'loading') return <Loading />
  if (state.status === 'error') {
    return (
      <LoadError
        title={state.notFound ? 'This enquiry isn’t here' : 'This enquiry didn’t load'}
        message={state.notFound ? 'It may have been removed, or the link is wrong.' : state.message}
        onRetry={state.notFound ? undefined : reload}
      >
        <Link to="/vendor/enquiries">All enquiries</Link>
      </LoadError>
    )
  }
  const b = state.data.booking

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
    <div className="gifts">
      <Link to="/vendor/enquiries" className="link-button">← All enquiries</Link>
      <div className="gifts-grid">
        <section className="card" aria-labelledby="enquiry-title">
          <h2 id="enquiry-title">{b.couple?.names ?? 'A couple'}</h2>
          <p className="muted">
            {[b.couple?.date && formatDate(b.couple.date), b.couple?.venueName, STATUS[b.status]].filter(Boolean).join(' · ')}
          </p>
          {error && <p role="alert" className="alert">{error}</p>}
          <Thread booking={b} canWrite={b.status !== 'cancelled'} onSend={(body) => act('messages', { body })} busy={busy} />
        </section>
        <div className="stack">
          {b.status === 'accepted' ? (
            <section className="card">
              <h2>Booked</h2>
              <p>
                <strong>{formatNaira(b.paid)}</strong> paid of {formatNaira(b.quote?.total ?? 0)}
                {b.balance > 0 ? ` · ${formatNaira(b.balance)} to go` : ' · fully paid'}
              </p>
              <progress className="meter" value={b.paid} max={b.quote?.total ?? 1} aria-label="Paid so far" />
              <p className="hint">Payments arrive in your payout account on Paystack’s usual schedule.</p>
            </section>
          ) : (
            b.status !== 'cancelled' && <QuoteForm booking={b} busy={busy} onSend={(body) => act('quote', body)} />
          )}
          {b.status !== 'cancelled' && b.paid === 0 && (
            <button type="button" className="link-button link-button--danger" onClick={() => act('decline')} disabled={busy}>
              Decline this booking
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type QuoteLine = { name: string; amount: string }

function QuoteForm({ booking, busy, onSend }: { booking: Booking; busy: boolean; onSend: (body: unknown) => Promise<void> }) {
  const [lines, setLines] = useState<QuoteLine[]>(
    booking.quote?.lines.map((l) => ({ name: l.name, amount: nairaInput(l.amount) })) ?? [{ name: booking.packageName ?? '', amount: '' }],
  )
  const [deposit, setDeposit] = useState(nairaInput(booking.quote?.deposit))
  const [validUntil, setValidUntil] = useState(booking.quote?.validUntil ?? '')
  const [note, setNote] = useState(booking.quote?.note ?? '')
  const total = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)

  function submit(e: FormEvent) {
    e.preventDefault()
    void onSend({
      lines: lines.map((l) => ({ name: l.name, amount: Number(l.amount) })),
      ...(deposit && { deposit: Number(deposit) }),
      ...(validUntil && { validUntil }),
      ...(note && { note }),
    })
  }

  const setLine = (i: number, patch: Partial<QuoteLine>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  return (
    <section className="card" aria-labelledby="quote-title">
      <h2 id="quote-title">{booking.quote ? 'Update your quote' : 'Send a quote'}</h2>
      <p className="muted">Once the couple accepts, they can pay you here, in full or in instalments.</p>
      <form onSubmit={submit}>
        {lines.map((l, i) => (
          <div className="field-row" key={i}>
            <Field label={i === 0 ? 'What’s included' : 'And'}>
              {(p) => <input {...p} required maxLength={120} value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} />}
            </Field>
            <Field label="Price">
              {(p) => <AmountInput {...p} min={1} required value={l.amount} onChange={(amount) => setLine(i, { amount })} />}
            </Field>
          </div>
        ))}
        <div className="actions">
          {lines.length < 30 && (
            <button type="button" className="link-button" onClick={() => setLines([...lines, { name: '', amount: '' }])}>
              Add a line
            </button>
          )}
          {lines.length > 1 && (
            <button type="button" className="link-button" onClick={() => setLines(lines.slice(0, -1))}>
              Remove the last line
            </button>
          )}
        </div>
        <p>
          Total: <strong>{formatNaira(total * 100)}</strong>
        </p>
        <div className="field-row">
          <Field label="Deposit" optional hint="The least they pay first to secure the date.">
            {(p) => <AmountInput {...p} min={1} max={total || undefined} value={deposit} onChange={setDeposit} />}
          </Field>
          <Field label="Valid until" optional>
            {(p) => <DatePicker {...p} clearable min={todayInLagos()} value={validUntil} onChange={setValidUntil} />}
          </Field>
        </div>
        <Field label="Note" optional>
          {(p) => <textarea {...p} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : booking.quote ? 'Send updated quote' : 'Send quote'}</button>
      </form>
    </section>
  )
}
