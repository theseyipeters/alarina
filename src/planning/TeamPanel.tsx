import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import Field from '../components/Field.tsx'
import Select from '../components/Select.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { CATEGORY_IDS, VENDOR_CATEGORIES, type VendorCategory } from '../lib/vendors.ts'
import BookingDetail from './BookingDetail.tsx'
import { TEAM_STATUS_LABELS, type Booking, type PlanningRole, type TeamMember, type TeamStatus } from './types.ts'
import { useLoad } from './useLoad.ts'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'

/**
 * A wedding's vendor team: marketplace vendors (who can be enquired with, booked and paid here)
 * and vendors found elsewhere (tracked by hand). The couple and main planner manage it.
 */
export default function TeamPanel({ weddingId, role }: { weddingId: string; role: PlanningRole }) {
  const [team, reloadTeam] = useLoad<{ team: TeamMember[] }>(`/planning/${weddingId}/team`)
  const [bookings, reloadBookings] = useLoad<{ bookings: Booking[] }>(`/planning/${weddingId}/bookings`)
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canEdit = role !== 'co'

  const reload = () => Promise.all([reloadTeam(), reloadBookings()])

  async function run(work: () => Promise<unknown>) {
    setError(null)
    try {
      await work()
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (team.status === 'loading') return <Loading label="Loading your vendors" />
  if (team.status === 'error') return <LoadError title="Your vendors didn’t load" message={team.message} onRetry={reload} />
  const members = team.data.team
  const openBooking = (memberId: string) =>
    bookings.status === 'ready' ? bookings.data.bookings.find((b) => b.weddingVendorId === memberId && b.status !== 'cancelled') : undefined

  return (
    <section className="card" aria-labelledby="team-title" data-tour="team">
      <div className="row">
        <h2 id="team-title">{role === 'couple' ? 'Your vendors' : 'Vendors'}</h2>
        {canEdit && <Link to="/marketplace" className="btn btn--secondary">Find vendors</Link>}
      </div>
      <p className="muted">
        Vendors from the marketplace can be booked and paid here. Add the ones you found elsewhere too, so the budget covers everyone.
      </p>
      {error && <p role="alert" className="alert">{error}</p>}

      {members.length === 0 ? (
        <EmptyState compact icon="store" title="No vendors yet">
          {canEdit
            ? 'Find them in the marketplace, or add the ones you already know, so your bookings and budget sit in one place.'
            : 'Vendors appear here as the couple or their main planner adds them.'}
        </EmptyState>
      ) : (
        <ul className="team-list">
          {members.map((m) => {
            const booking = openBooking(m.id)
            return (
              <li key={m.id} className="team-member">
                <div className="team-member-head">
                  <span className="gift-name">
                    {m.vendorSlug ? <Link to={`/marketplace/${m.vendorSlug}`}>{m.name}</Link> : m.name}
                    <span className="hint">
                      {VENDOR_CATEGORIES[m.category].one}
                      {!m.vendorId && ' · not on Alárinà'}
                      {(m.phone || m.email) && ` · ${[m.phone, m.email].filter(Boolean).join(' · ')}`}
                    </span>
                  </span>
                  {canEdit ? (
                    <Select
                      aria-label={`Status for ${m.name}`}
                      value={m.status}
                      onChange={(status) => run(() => api.patch(`/planning/${weddingId}/team/${m.id}`, { status: status as TeamStatus }))}
                      options={(Object.keys(TEAM_STATUS_LABELS) as TeamStatus[]).map((s) => ({ value: s, label: TEAM_STATUS_LABELS[s] }))}
                    />
                  ) : (
                    <span className="badge">{TEAM_STATUS_LABELS[m.status]}</span>
                  )}
                </div>
                <div className="actions">
                  {booking ? (
                    <button type="button" className="link-button" onClick={() => setOpen(open === booking.id ? null : booking.id)}>
                      {open === booking.id ? 'Hide booking' : bookingLabel(booking)}
                    </button>
                  ) : (
                    m.vendorId && canEdit && <Enquire weddingId={weddingId} member={m} onSent={reload} />
                  )}
                  {canEdit && !booking && (
                    <button type="button" className="link-button" onClick={() => run(() => api.delete(`/planning/${weddingId}/team/${m.id}`))}>
                      Remove<span className="visually-hidden"> {m.name}</span>
                    </button>
                  )}
                </div>
                {booking && open === booking.id && <BookingDetail weddingId={weddingId} bookingId={booking.id} role={role} onChange={reload} />}
              </li>
            )
          })}
        </ul>
      )}

      {canEdit &&
        (adding ? (
          <AddOffline
            onSave={async (body) => {
              await api.post(`/planning/${weddingId}/team`, body)
              setAdding(false)
              await reload()
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button type="button" className="btn btn--secondary" onClick={() => setAdding(true)}>
            Add a vendor you found elsewhere
          </button>
        ))}
    </section>
  )
}

const bookingLabel = (b: Booking) =>
  ({
    enquiry: 'Enquiry sent · open',
    quoted: 'Quote received · open',
    accepted: b.balance > 0 ? 'Booked · pay or view' : 'Booked and paid · view',
    cancelled: 'Cancelled',
  })[b.status]

function Enquire({ weddingId, member, onSent }: { weddingId: string; member: TeamMember; onSent: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post(`/planning/${weddingId}/team/${member.id}/enquiry`, { message })
      setOpen(false)
      await onSent()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="link-button" onClick={() => setOpen(true)}>
        Send an enquiry<span className="visually-hidden"> to {member.name}</span>
      </button>
    )
  }
  return (
    <form onSubmit={send} className="item-form">
      {error && <p role="alert" className="alert">{error}</p>}
      <Field label={`Message to ${member.name}`} hint="Your date, venue, guest numbers and what you’d like. They’ll reply with a quote.">
        {(p) => <textarea {...p} rows={4} required maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />}
      </Field>
      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button>
        <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  )
}

type OfflineDraft = { name: string; category: VendorCategory; phone: string; email: string; notes: string }

function AddOffline({ onSave, onCancel }: { onSave: (body: OfflineDraft) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState<OfflineDraft>({ name: '', category: 'other', phone: '', email: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave(draft)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form className="item-form" onSubmit={submit}>
      {error && <p role="alert" className="alert">{error}</p>}
      <Field label="Name">{(p) => <input {...p} required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}</Field>
      <Field label="What they do">
        {(p) => (
          <Select
            {...p}
            value={draft.category}
            onChange={(category) => setDraft({ ...draft, category: category as VendorCategory })}
            options={CATEGORY_IDS.map((id) => ({ value: id, label: VENDOR_CATEGORIES[id].label }))}
          />
        )}
      </Field>
      <div className="field-row">
        <Field label="Phone" optional>{(p) => <input {...p} type="tel" maxLength={30} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />}</Field>
        <Field label="Email" optional>{(p) => <input {...p} type="email" maxLength={254} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />}</Field>
      </div>
      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Adding…' : 'Add vendor'}</button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
