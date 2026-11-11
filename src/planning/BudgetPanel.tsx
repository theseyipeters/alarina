import { useState, type FormEvent } from 'react'
import DatePicker from '../components/DatePicker.tsx'
import Field from '../components/Field.tsx'
import Select from '../components/Select.tsx'
import { api, apiUrl } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatDate, todayInLagos } from '../lib/format.ts'
import { formatNaira } from '../lib/money.ts'
import { CATEGORY_IDS, VENDOR_CATEGORIES } from '../lib/vendors.ts'
import { LINE_STATUS_LABELS, type Budget, type BudgetCategory, type BudgetLine, type TeamMember } from './types.ts'
import { useLoad } from './useLoad.ts'

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  ...Object.fromEntries(CATEGORY_IDS.map((id) => [id, VENDOR_CATEGORIES[id].label])),
  personal: 'Personal',
} as Record<BudgetCategory, string>
const BUDGET_CATEGORIES = [...CATEGORY_IDS, 'personal'] as BudgetCategory[]

/**
 * The cost breakdown: every line towards the wedding, what it costs and what's been paid, in the
 * app or outside it. Bookings paid here fill themselves in; anything else is recorded by hand.
 * The couple and main planner edit it; co-planners read it. Everyone can export it.
 */
export default function BudgetPanel({ weddingId }: { weddingId: string }) {
  const [state, reload] = useLoad<Budget>(`/planning/${weddingId}/budget`)
  const [team] = useLoad<{ team: TeamMember[] }>(`/planning/${weddingId}/team`)
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [paying, setPaying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'loading') return <p className="muted">Loading your budget…</p>
  if (state.status === 'error') return <p role="alert" className="alert">{state.message}</p>
  const { lines, categories, overall, canEdit } = state.data
  const members = team.status === 'ready' ? team.data.team : []

  /** Runs a change and reloads. Says whether it worked, so a form only closes once it has. */
  async function run(work: () => Promise<unknown>) {
    setError(null)
    try {
      await work()
      await reload()
      return true
    } catch (err) {
      setError(errorMessage(err))
      return false
    }
  }

  return (
    <div className="gifts">
      <section className="gifts-hero" aria-labelledby="budget-title" data-tour="budget-summary">
        <div>
          <p className="eyebrow">Cost breakdown</p>
          <h1 id="budget-title" className="gifts-total">{formatNaira(overall.cost)}</h1>
          <p className="muted">
            {formatNaira(overall.paid)} paid · <strong>{formatNaira(overall.outstanding)} still to pay</strong>
            {overall.count > 0 && ` · ${overall.count} ${overall.count === 1 ? 'item' : 'items'}`}
          </p>
          {overall.cost > 0 && <progress className="meter" value={overall.paid} max={overall.cost} aria-label="Paid so far" />}
        </div>
        <div className="actions" data-tour="budget-export">
          {/* Links, so the browser downloads the file with the session cookie. */}
          <a className="btn btn--secondary" href={apiUrl(`/planning/${weddingId}/budget/export.pdf`)}>Export PDF</a>
          <a className="btn btn--secondary" href={apiUrl(`/planning/${weddingId}/budget/export.xlsx`)}>Export Excel</a>
        </div>
      </section>

      {error && <p role="alert" className="alert">{error}</p>}

      {lines.length === 0 && editing !== 'new' && (
        <p className="board-empty">
          Nothing here yet. Add what each part of the day costs: vendors you book here appear on their own once you accept their quote.
        </p>
      )}

      {categories.map((c) => (
        <section key={c.category} className="card" aria-labelledby={`cat-${c.category}`}>
          <div className="row">
            <h2 id={`cat-${c.category}`}>{CATEGORY_LABELS[c.category]}</h2>
            <span className="hint">
              {formatNaira(c.paid)} of {formatNaira(c.cost)}
            </span>
          </div>
          <div className="table-scroll">
            <table className="budget-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Paid</th>
                  <th scope="col">Still to pay</th>
                  <th scope="col">Status</th>
                  {canEdit && <th scope="col"><span className="visually-hidden">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {lines
                  .filter((l) => l.category === c.category)
                  .map((l) =>
                    editing === l.id ? (
                      <tr key={l.id}>
                        <td colSpan={6}>
                          <LineForm
                            line={l}
                            members={members}
                            onSave={(body) => run(() => api.patch(`/planning/${weddingId}/budget/${l.id}`, body)).then((ok) => void (ok && setEditing(null)))}
                            onCancel={() => setEditing(null)}
                          />
                        </td>
                      </tr>
                    ) : (
                      <LineRow
                        key={l.id}
                        line={l}
                        canEdit={canEdit}
                        paying={paying === l.id}
                        onEdit={() => setEditing(l.id)}
                        onPay={() => setPaying(paying === l.id ? null : l.id)}
                        onRemove={() => run(() => api.delete(`/planning/${weddingId}/budget/${l.id}`))}
                        onRecord={(body) => run(() => api.post(`/planning/${weddingId}/budget/${l.id}/payments`, body)).then((ok) => void (ok && setPaying(null)))}
                        onUnrecord={(paymentId) => run(() => api.delete(`/planning/${weddingId}/budget/${l.id}/payments/${paymentId}`))}
                      />
                    ),
                  )}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {canEdit &&
        (editing === 'new' ? (
          <section className="card">
            <h2>Add a cost</h2>
            <LineForm
              line={null}
              members={members}
              onSave={(body) => run(() => api.post(`/planning/${weddingId}/budget`, body)).then((ok) => void (ok && setEditing(null)))}
              onCancel={() => setEditing(null)}
            />
          </section>
        ) : (
          <button type="button" className="btn" onClick={() => setEditing('new')} data-tour="budget-add">
            Add a cost
          </button>
        ))}
    </div>
  )
}

type RowProps = {
  line: BudgetLine
  canEdit: boolean
  paying: boolean
  onEdit: () => void
  onPay: () => void
  onRemove: () => void
  onRecord: (body: { amount: number; date: string; note?: string }) => Promise<void>
  onUnrecord: (paymentId: string) => void
}

function LineRow({ line: l, canEdit, paying, onEdit, onPay, onRemove, onRecord, onUnrecord }: RowProps) {
  return (
    <>
      <tr>
        <th scope="row">
          {l.name}
          <span className="hint">
            {[l.vendorName, l.dueDate && `due ${formatDate(l.dueDate)}`].filter(Boolean).join(' · ')}
            {l.overdue && <span className="badge badge--warn"> Overdue</span>}
          </span>
          {l.notes && <span className="hint">{l.notes}</span>}
        </th>
        <td>{formatNaira(l.cost)}</td>
        <td>
          {formatNaira(l.paid)}
          {l.paidInApp > 0 && <span className="hint">{formatNaira(l.paidInApp)} in app</span>}
        </td>
        <td>{formatNaira(l.outstanding)}{l.overpaid > 0 && <span className="hint">{formatNaira(l.overpaid)} over</span>}</td>
        <td><span className={l.status === 'paid' ? 'badge badge--live' : 'badge'}>{LINE_STATUS_LABELS[l.status]}</span></td>
        {canEdit && (
          <td className="item-actions">
            <button type="button" className="link-button" onClick={onPay}>
              Record payment<span className="visually-hidden"> for {l.name}</span>
            </button>
            <button type="button" className="link-button" onClick={onEdit}>
              Edit<span className="visually-hidden"> {l.name}</span>
            </button>
            {!l.bookingId && (
              <button type="button" className="link-button" onClick={onRemove}>
                Remove<span className="visually-hidden"> {l.name}</span>
              </button>
            )}
          </td>
        )}
      </tr>
      {(paying || l.offlinePayments.length > 0) && (
        <tr className="budget-sub">
          <td colSpan={6}>
            {l.offlinePayments.length > 0 && (
              <ul className="hint">
                {l.offlinePayments.map((p) => (
                  <li key={p.id}>
                    {formatNaira(p.amount)} on {formatDate(p.date)}
                    {p.note && ` · ${p.note}`} · recorded by {p.recordedByName}
                    {canEdit && (
                      <>
                        {' '}
                        <button type="button" className="link-button" onClick={() => onUnrecord(p.id)}>Remove</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {paying && <RecordPayment outstanding={l.outstanding} onSave={onRecord} />}
          </td>
        </tr>
      )}
    </>
  )
}

function RecordPayment({ outstanding, onSave }: { outstanding: number; onSave: (body: { amount: number; date: string; note?: string }) => Promise<void> }) {
  const [amount, setAmount] = useState(outstanding > 0 ? String(outstanding / 100) : '')
  const [date, setDate] = useState(todayInLagos())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    await onSave({ amount: Number(amount), date, ...(note && { note }) })
    setBusy(false)
  }

  return (
    <form className="item-form" onSubmit={submit}>
      <p className="hint">For money paid outside Alárinà: cash, a transfer, a vendor who isn’t on the app.</p>
      <div className="field-row">
        <Field label="Amount (₦)">{(p) => <input {...p} type="number" inputMode="numeric" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
        <Field label="Date paid">{(p) => <DatePicker {...p} value={date} onChange={setDate} />}</Field>
      </div>
      <Field label="Note" optional>{(p) => <input {...p} maxLength={300} placeholder="Bank transfer, cash…" value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      <button className="btn btn--secondary" disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</button>
    </form>
  )
}

type LineBody = { name: string; category: BudgetCategory; cost: number; weddingVendorId: string | null; dueDate: string | null; notes: string }

function LineForm({ line, members, onSave, onCancel }: { line: BudgetLine | null; members: TeamMember[]; onSave: (body: LineBody) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState({
    name: line?.name ?? '',
    category: (line?.category ?? 'other') as BudgetCategory,
    cost: line ? String(line.cost / 100) : '',
    weddingVendorId: line?.weddingVendorId ?? '',
    dueDate: line?.dueDate ?? '',
    notes: line?.notes ?? '',
  })
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    await onSave({
      name: draft.name,
      category: draft.category,
      cost: Number(draft.cost || 0),
      weddingVendorId: draft.weddingVendorId || null,
      dueDate: draft.dueDate || null,
      notes: draft.notes,
    })
    setBusy(false)
  }

  // Picking a vendor fills in the name and category, which can still be changed.
  function pickVendor(id: string) {
    const m = members.find((x) => x.id === id)
    setDraft({ ...draft, weddingVendorId: id, ...(m && !draft.name && { name: m.name }), ...(m && { category: m.category }) })
  }

  return (
    <form className="item-form" onSubmit={submit}>
      {members.length > 0 && (
        <Field label="Vendor" optional>
          {(p) => (
            <Select
              {...p}
              value={draft.weddingVendorId}
              disabled={Boolean(line?.bookingId)}
              onChange={pickVendor}
              options={[{ value: '', label: 'None' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
            />
          )}
        </Field>
      )}
      <Field label="Item">{(p) => <input {...p} required maxLength={120} placeholder="Reception hall" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}</Field>
      <div className="field-row">
        <Field label="Category">
          {(p) => (
            <Select
              {...p}
              value={draft.category}
              onChange={(category) => setDraft({ ...draft, category: category as BudgetCategory })}
              options={BUDGET_CATEGORIES.map((id) => ({ value: id, label: CATEGORY_LABELS[id] }))}
            />
          )}
        </Field>
        <Field label="Total cost (₦)">{(p) => <input {...p} type="number" inputMode="numeric" min={0} required value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: e.target.value })} />}</Field>
      </div>
      <Field label="Due date" optional>{(p) => <DatePicker {...p} clearable value={draft.dueDate} onChange={(dueDate) => setDraft({ ...draft, dueDate })} />}</Field>
      <Field label="Notes" optional>{(p) => <textarea {...p} rows={2} maxLength={1000} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />}</Field>
      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
