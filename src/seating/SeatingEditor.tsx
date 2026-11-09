import { useMemo, useState } from 'react'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { useLoad } from '../planning/useLoad.ts'
import FloorPlan from './FloorPlan.tsx'
import { freeSpot, nextId, takenByTable } from './geometry.ts'
import GuestTableCard from './GuestTableCard.tsx'
import { FEATURE_LABELS, type FeatureKind, type GuestSeating, type Party, type Plan, type Point, type Seating, type ViewStyle } from './types.ts'
import './seating.css'

/**
 * Seating for the planning team: the hall from above, tables to drag about, and guests to seat.
 * The couple and main planner edit; co-planners see it. Sharing it shows each guest their table.
 */
export default function SeatingEditor({ weddingId }: { weddingId: string }) {
  const base = `/planning/${weddingId}/seating`
  const [state, reload] = useLoad<Seating>(base)
  // The layout as edited here; saved to the server after each change.
  const [plan, setPlan] = useState<Plan | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Take the server's layout each time it loads (after seating someone, say).
  const [loadedFrom, setLoadedFrom] = useState<Seating | null>(null)
  if (state.status === 'ready' && state.data !== loadedFrom) {
    setLoadedFrom(state.data)
    setPlan(state.data.plan)
  }

  const taken = useMemo(() => (state.status === 'ready' ? takenByTable(state.data.parties) : new Map<string, number[]>()), [state])

  if (state.status === 'loading' || !plan) return <p className="muted">Loading the seating plan…</p>
  if (state.status === 'error') return <p role="alert" className="alert">{state.message}</p>
  const { parties, totals, canEdit } = state.data

  async function save(next: Plan) {
    const before = plan
    setPlan(next)
    setSaving(true)
    setError(null)
    try {
      await api.put(`${base}/plan`, next)
    } catch (err) {
      // Put it back as it was, so the screen matches what's saved.
      setPlan(before)
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function assign(rsvpId: string, tableId: string | null) {
    setError(null)
    try {
      await api.post(`${base}/assign`, { rsvpId, tableId })
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  function move(kind: 'table' | 'feature', id: string, at: Point) {
    if (!plan) return
    save(
      kind === 'table'
        ? { ...plan, tables: plan.tables.map((t) => (t.id === id ? { ...t, ...at } : t)) }
        : { ...plan, features: plan.features.map((f) => (f.id === id ? { ...f, ...at } : f)) },
    )
  }

  function addTable(shape: 'round' | 'long') {
    if (!plan) return
    const id = nextId('t', plan.tables.map((t) => t.id))
    const at = freeSpot(plan)
    save({ ...plan, tables: [...plan.tables, { id, name: `Table ${plan.tables.length + 1}`, shape, seats: shape === 'round' ? 10 : 12, rotation: 0, ...at }] })
    setSelected(id)
  }

  function addFeature(kind: FeatureKind) {
    if (!plan) return
    const size = { stage: [8, 3], high_table: [7, 1.2], dance_floor: [8, 5], entrance: [3, 1], dj: [2.5, 1.5], bar: [4, 1.2] }[kind]
    save({
      ...plan,
      features: [...plan.features, { id: nextId('f', plan.features.map((f) => f.id)), kind, label: FEATURE_LABELS[kind], x: plan.width / 2, y: plan.depth / 2, w: size[0]!, h: size[1]! }],
    })
  }

  const table = plan.tables.find((t) => t.id === selected) ?? null
  const unseated = parties.filter((p) => !p.tableId)
  const freeAt = (tableId: string) => (plan.tables.find((t) => t.id === tableId)?.seats ?? 0) - (taken.get(tableId)?.length ?? 0)

  return (
    <div className="seating">
      <div className="seating-totals" data-tour="seating-totals">
        <Stat value={totals.people} label="coming" />
        <Stat value={totals.seated} label="seated" />
        <Stat value={totals.unseated} label="to seat" warn={totals.unseated > 0} />
        <Stat value={totals.capacity} label="seats" />
        <Stat value={plan.tables.length} label="tables" />
        {totals.people > totals.capacity && <p className="alert">You need {totals.people - totals.capacity} more seats for everyone coming.</p>}
      </div>

      {error && <p role="alert" className="alert">{error}</p>}

      <div className="seating-layout">
        <section className="card seating-plan" aria-labelledby="plan-title">
          <div className="row">
            <h2 id="plan-title">The hall</h2>
            <span className="hint" aria-live="polite">{saving ? 'Saving…' : canEdit ? 'Drag tables to arrange them' : 'View only'}</span>
          </div>
          <FloorPlan
            plan={plan}
            taken={taken}
            editable={canEdit}
            onMove={move}
            selected={selected}
            onSelect={setSelected}
            onDropParty={canEdit ? (tableId, rsvpId) => assign(rsvpId, tableId) : undefined}
          />
          {canEdit && (
            <div className="actions">
              <button type="button" className="btn btn--secondary" onClick={() => addTable('round')}>Add round table</button>
              <button type="button" className="btn btn--secondary" onClick={() => addTable('long')}>Add long table</button>
              <select aria-label="Add to the hall" value="" onChange={(e) => e.target.value && addFeature(e.target.value as FeatureKind)}>
                <option value="">Add stage, dance floor…</option>
                {(Object.keys(FEATURE_LABELS) as FeatureKind[]).map((k) => (
                  <option key={k} value={k}>{FEATURE_LABELS[k]}</option>
                ))}
              </select>
            </div>
          )}
          {table && (
            <TableInspector
              key={table.id}
              plan={plan}
              tableId={table.id}
              canEdit={canEdit}
              taken={taken.get(table.id) ?? []}
              parties={parties.filter((p) => p.tableId === table.id)}
              onSave={save}
              onUnseat={(id) => assign(id, null)}
              onClose={() => setSelected(null)}
            />
          )}
        </section>

        <div className="stack">
          <section className="card" aria-labelledby="guests-title" data-tour="seating-guests">
            <h2 id="guests-title">Guests to seat</h2>
            {parties.length === 0 ? (
              <p className="board-empty">Guests appear here as they accept.</p>
            ) : unseated.length === 0 ? (
              <p className="alert alert--success">Everyone coming has a seat.</p>
            ) : (
              <>
                {canEdit && <p className="hint">Drag a guest onto a table, or choose one.</p>}
                <ul className="party-list">
                  {unseated.map((p) => (
                    <PartyRow key={p.id} party={p} plan={plan} freeAt={freeAt} canEdit={canEdit} onAssign={assign} />
                  ))}
                </ul>
              </>
            )}
          </section>
          <SharePanel base={base} plan={state.data.plan} canEdit={canEdit} tableId={selected ?? plan.tables[0]?.id ?? null} onChange={reload} />
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, warn }: { value: number; label: string; warn?: boolean }) {
  return (
    <p className={warn ? 'seating-stat is-warn' : 'seating-stat'}>
      <strong>{value}</strong> {label}
    </p>
  )
}

function PartyRow({ party: p, plan, freeAt, canEdit, onAssign }: { party: Party; plan: Plan; freeAt: (id: string) => number; canEdit: boolean; onAssign: (id: string, tableId: string | null) => void }) {
  return (
    <li
      className="party"
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/x-rsvp', p.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <span className="gift-name">
        {p.name}
        <span className="hint">{p.partySize === 1 ? '1 person' : `${p.partySize} people`}</span>
      </span>
      {canEdit && (
        <select aria-label={`Table for ${p.name}`} value="" onChange={(e) => e.target.value && onAssign(p.id, e.target.value)}>
          <option value="">Seat at…</option>
          {plan.tables.map((t) => {
            const free = freeAt(t.id)
            return (
              <option key={t.id} value={t.id} disabled={free < p.partySize}>
                {t.name} ({free} free)
              </option>
            )
          })}
        </select>
      )}
    </li>
  )
}

type InspectorProps = {
  plan: Plan
  tableId: string
  canEdit: boolean
  taken: number[]
  parties: Party[]
  onSave: (plan: Plan) => void
  onUnseat: (rsvpId: string) => void
  onClose: () => void
}

/** The selected table: rename it, change its shape or size, see and unseat who's there, remove it. */
function TableInspector({ plan, tableId, canEdit, taken, parties, onSave, onUnseat, onClose }: InspectorProps) {
  const table = plan.tables.find((t) => t.id === tableId)!
  const [name, setName] = useState(table.name)
  const highest = Math.max(0, ...taken)
  const update = (patch: Partial<typeof table>) => onSave({ ...plan, tables: plan.tables.map((t) => (t.id === tableId ? { ...t, ...patch } : t)) })

  return (
    <div className="table-inspector" aria-labelledby="inspector-title">
      <div className="row">
        <h3 id="inspector-title">{table.name}</h3>
        <button type="button" className="link-button" onClick={onClose}>Close</button>
      </div>
      <p className="hint">{taken.length} of {table.seats} seats taken</p>
      {canEdit && (
        <div className="field-row">
          <div className="field">
            <label htmlFor="table-name">Name</label>
            <input id="table-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== table.name && update({ name: name.trim() })} />
          </div>
          <div className="field">
            <label htmlFor="table-seats">Seats</label>
            <input
              id="table-seats"
              type="number"
              min={Math.max(1, highest)}
              max={30}
              value={table.seats}
              onChange={(e) => {
                const seats = Number(e.target.value)
                if (seats >= Math.max(1, highest) && seats <= 30) update({ seats })
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="table-shape">Shape</label>
            <select id="table-shape" value={table.shape} onChange={(e) => update({ shape: e.target.value as 'round' | 'long' })}>
              <option value="round">Round</option>
              <option value="long">Long</option>
            </select>
          </div>
          {table.shape === 'long' && (
            <div className="field">
              <label htmlFor="table-turn">Turn</label>
              <select id="table-turn" value={table.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })}>
                <option value={0}>Across</option>
                <option value={90}>Lengthways</option>
              </select>
            </div>
          )}
        </div>
      )}
      {parties.length > 0 && (
        <ul className="party-list">
          {parties.map((p) => (
            <li key={p.id} className="party">
              <span className="gift-name">
                {p.name}
                <span className="hint">
                  {p.seats.length === 1 ? `Seat ${p.seats[0]}` : `Seats ${p.seats.join(', ')}`}
                </span>
              </span>
              {canEdit && (
                <button type="button" className="link-button" onClick={() => onUnseat(p.id)}>
                  Unseat<span className="visually-hidden"> {p.name}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && taken.length === 0 && (
        <button type="button" className="link-button link-button--danger" onClick={() => { onSave({ ...plan, tables: plan.tables.filter((t) => t.id !== tableId) }); onClose() }}>
          Remove this table
        </button>
      )}
    </div>
  )
}

/** Share with guests, choosing how they see the hall, with a preview of a table in both styles. */
function SharePanel({ base, plan, canEdit, tableId, onChange }: { base: string; plan: Seating['plan']; canEdit: boolean; tableId: string | null; onChange: () => Promise<void> }) {
  const [view, setView] = useState<ViewStyle>(plan.view)
  const [preview, setPreview] = useState<GuestSeating | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function share(shared: boolean, nextView = view) {
    setBusy(true)
    setMessage(null)
    try {
      const { emailed } = await api.post<{ emailed: number }>(`${base}/share`, { shared, view: nextView })
      setMessage({ ok: true, text: shared ? (emailed ? `Shared. We emailed ${emailed} seated ${emailed === 1 ? 'guest' : 'guests'} their table.` : 'Shared with guests.') : 'Hidden from guests.' })
      await onChange()
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  async function openPreview() {
    if (!tableId) return
    try {
      setPreview((await api.get<{ seating: GuestSeating }>(`${base}/preview/${tableId}`)).seating)
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    }
  }

  return (
    <section className="card" aria-labelledby="share-title" data-tour="seating-share">
      <h2 id="share-title">Share with guests</h2>
      <p className="muted">
        Guests who are coming see their table on their private RSVP page: where it is, the way from the entrance and who they’re sitting
        with, by first name. They can’t see anyone else’s table.
      </p>
      <fieldset className="choices">
        <legend>How guests see the hall</legend>
        <label className="choice">
          <input type="radio" name="view" checked={view === 'perspective'} disabled={!canEdit} onChange={() => { setView('perspective'); if (plan.shared) void share(true, 'perspective') }} />
          Perspective: the plan tilted, quick on any phone
        </label>
        <label className="choice">
          <input type="radio" name="view" checked={view === '3d'} disabled={!canEdit} onChange={() => { setView('3d'); if (plan.shared) void share(true, '3d') }} />
          3D hall: walk in from the entrance
        </label>
      </fieldset>
      {message && <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'alert alert--success' : 'alert'}>{message.text}</p>}
      <div className="actions">
        {canEdit &&
          (plan.shared ? (
            <button type="button" className="btn btn--secondary" onClick={() => share(false)} disabled={busy}>Hide from guests</button>
          ) : (
            <button type="button" className="btn" onClick={() => share(true)} disabled={busy}>{busy ? 'Sharing…' : 'Share with guests'}</button>
          ))}
        {tableId && (
          <button type="button" className="btn btn--secondary" onClick={preview ? () => setPreview(null) : openPreview}>
            {preview ? 'Close preview' : 'Preview a guest’s view'}
          </button>
        )}
      </div>
      {plan.shared && <p className="hint">Shared {plan.sharedAt && `since ${new Date(plan.sharedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}. Changes show straight away.</p>}
      {preview && (
        <div className="seating-preview">
          <p className="hint">How a guest at {preview.table.name} sees it, in both styles:</p>
          <GuestTableCard seating={{ ...preview, view: 'perspective' }} preview />
          <GuestTableCard seating={{ ...preview, view: '3d' }} preview />
        </div>
      )}
    </section>
  )
}
