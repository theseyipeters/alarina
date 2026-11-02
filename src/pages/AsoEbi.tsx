import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import Field from '../components/Field.tsx'
import ImageField from '../components/ImageField.tsx'
import { api, ApiError, imageSrc } from '../lib/api.ts'
import { MAX_PRICE_NAIRA, MIN_PRICE_NAIRA, quantityLabel, UNITS, type AsoEbiUnit } from '../lib/asoEbi.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira } from '../lib/money.ts'
import type { AsoEbiOverview } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type State = { status: 'loading' } | { status: 'error' } | { status: 'none' } | { status: 'ready'; data: AsoEbiOverview }
type Item = AsoEbiOverview['items'][number]

/** Aso-ebi: the couple lists the material and sets the price; guests buy it through the invitation. */
export default function AsoEbi() {
  useTitle('Aso-ebi')
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<AsoEbiOverview>('/wedding/gifts/aso-ebi').then(
        (data) => setState({ status: 'ready', data }),
        (err) => setState({ status: err instanceof ApiError && err.code === 'no_wedding' ? 'none' : 'error' }),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  if (state.status === 'loading') return <p className="muted">Loading aso-ebi…</p>
  if (state.status === 'error') return <p role="alert" className="alert">Aso-ebi couldn’t be loaded. Refresh to try again.</p>
  if (state.status === 'none') {
    return (
      <div className="card">
        <h1>Aso-ebi</h1>
        <p className="muted">Set up your wedding first, then come back to offer aso-ebi.</p>
      </div>
    )
  }

  const { data } = state
  return (
    <div className="gifts">
      <header className="gifts-hero">
        <div>
          <p className="eyebrow">Aso-ebi paid so far</p>
          <p className="gifts-total">{formatNaira(data.totals.received)}</p>
          <p className="muted">
            {data.totals.count === 0
              ? 'No orders yet.'
              : `${data.totals.count} ${data.totals.count === 1 ? 'order' : 'orders'}.`}{' '}
            Paid straight into your account by Paystack.
          </p>
        </div>
        <span className={data.enabled ? 'badge badge--live' : 'badge'}>{data.enabled ? 'Open to guests' : 'Off'}</span>
      </header>

      <div className="gifts-grid">
        <Items items={data.items} onChange={load} />
        <AsoEbiSwitch data={data} onChange={load} />
      </div>

      <Orders data={data} />
    </div>
  )
}

type Draft = { name: string; description: string; imageId: string | null; unit: AsoEbiUnit; price: string }
const EMPTY: Draft = { name: '', description: '', imageId: null, unit: 'set', price: '' }

function Items({ items, onChange }: { items: Item[]; onChange: () => void }) {
  // `null` is closed, 'new' is the add form, otherwise the id of the item being edited.
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [removing, setRemoving] = useState<Item | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  function askRemove(item: Item, trigger: HTMLElement) {
    returnFocusRef.current = trigger
    setRemoving(item)
    dialogRef.current?.showModal()
  }

  async function confirmRemove() {
    if (!removing) return
    try {
      await api.delete(`/wedding/gifts/aso-ebi/items/${removing.id}`)
      dialogRef.current?.close()
      onChange()
    } catch (err) {
      setError(errorMessage(err))
      dialogRef.current?.close()
    }
  }

  return (
    <section className="card" aria-labelledby="items-title">
      <h2 id="items-title">What you’re offering</h2>
      <p className="muted">List each material with your price. Guests choose how much to buy.</p>
      {error && <p role="alert" className="alert">{error}</p>}

      {items.length > 0 && (
        <ul className="item-list">
          {items.map((item) =>
            editing === item.id ? (
              <li key={item.id}>
                <ItemForm
                  initial={{ name: item.name, description: item.description, imageId: item.imageId, unit: item.unit, price: String(item.price / 100) }}
                  itemId={item.id}
                  onDone={() => {
                    setEditing(null)
                    onChange()
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={item.id}>
                <span className="item-main">
                  {item.imageId && <img className="thumb" src={imageSrc(item.imageId)} alt="" loading="lazy" />}
                <span className="gift-name">
                  {item.name}
                  <span className="hint">
                    {formatNaira(item.price)} per {item.unit}
                    {item.sold > 0 && ` · ${quantityLabel(item.sold, item.unit)} sold`}
                  </span>
                  {item.description && <span className="hint">{item.description}</span>}
                </span>
                </span>
                <span className="item-actions">
                  <button type="button" className="link-button" onClick={() => setEditing(item.id)}>
                    Edit<span className="visually-hidden"> {item.name}</span>
                  </button>
                  <button type="button" className="link-button" onClick={(e) => askRemove(item, e.currentTarget)}>
                    Remove<span className="visually-hidden"> {item.name}</span>
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}

      {editing === 'new' ? (
        <ItemForm
          initial={EMPTY}
          itemId={null}
          onDone={() => {
            setEditing(null)
            onChange()
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button type="button" className="btn btn--secondary" onClick={() => setEditing('new')}>
          {items.length === 0 ? 'Add your first item' : 'Add another item'}
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="dialog"
        aria-labelledby="remove-item-title"
        onClose={() => {
          setRemoving(null)
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus()
          else document.getElementById('items-title')?.focus()
        }}
      >
        <h2 id="remove-item-title">Remove {removing?.name}?</h2>
        <p className="muted">
          Guests will no longer be able to order it. Orders already placed stay in your list with the price they paid.
        </p>
        <div className="actions actions--end">
          <button type="button" className="btn btn--secondary" onClick={() => dialogRef.current?.close()} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn" onClick={confirmRemove}>
            Remove item
          </button>
        </div>
      </dialog>
    </section>
  )
}

type FormProps = {
  initial: Draft
  /** The item being edited, or null when adding. */
  itemId: string | null
  onDone: () => void
  onCancel: () => void
}

function ItemForm({ initial, itemId, onDone, onCancel }: FormProps) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    const price = Number(draft.price)
    if (!Number.isInteger(price) || price < MIN_PRICE_NAIRA || price > MAX_PRICE_NAIRA) {
      setError(`Enter a price between ${formatNaira(MIN_PRICE_NAIRA * 100)} and ${formatNaira(MAX_PRICE_NAIRA * 100)}.`)
      return
    }
    setBusy(true)
    setError(null)
    const body = { name: draft.name, description: draft.description, imageId: draft.imageId, unit: draft.unit, price }
    try {
      if (itemId) await api.put(`/wedding/gifts/aso-ebi/items/${itemId}`, body)
      else await api.post('/wedding/gifts/aso-ebi/items', body)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="item-form">
      <Field label="Name" hint="For example, Emerald lace.">
        {(p) => (
          <input {...p} type="text" required maxLength={60} autoFocus value={draft.name} onChange={(e) => set('name', e.target.value)} />
        )}
      </Field>
      <Field label="Sold by">
        {(p) => (
          <select {...p} value={draft.unit} onChange={(e) => set('unit', e.target.value as AsoEbiUnit)}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label={`Price per ${draft.unit} in naira`} hint={`From ${formatNaira(MIN_PRICE_NAIRA * 100)}. Guests pay Paystack’s fee on top.`}>
        {(p) => (
          <input
            {...p}
            type="text"
            inputMode="numeric"
            required
            placeholder="15000"
            value={draft.price}
            onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))}
          />
        )}
      </Field>
      <Field label="Details" optional hint="Colour, how many yards in a set, anything guests should know.">
        {(p) => <textarea {...p} rows={3} maxLength={300} value={draft.description} onChange={(e) => set('description', e.target.value)} />}
      </Field>
      <ImageField value={draft.imageId} onChange={(imageId) => set('imageId', imageId)} />
      {error && <p role="alert" className="alert">{error}</p>}
      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : itemId ? 'Save changes' : 'Add item'}</button>
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  )
}

const SWITCH_ERRORS: Record<string, string> = {
  fees_not_confirmed:
    'Aso-ebi can’t be switched on yet: payment fees still need confirming on the server (PAYSTACK_FEES_CONFIRMED).',
  no_payout_account: 'Add the account payments should go to first.',
  no_items: 'Add an item first.',
}

function AsoEbiSwitch({ data, onChange }: { data: AsoEbiOverview; onChange: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      await api.patch('/wedding/gifts/aso-ebi', { enabled: !data.enabled })
      onChange()
    } catch (err) {
      setError(err instanceof ApiError ? (SWITCH_ERRORS[err.code] ?? err.message) : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="aso-switch-title">
      <div className="switch-row">
        <h2 id="aso-switch-title">Offer aso-ebi to guests</h2>
        <button
          type="button"
          role="switch"
          aria-checked={data.enabled}
          aria-labelledby="aso-switch-title"
          className="switch"
          onClick={toggle}
          disabled={busy}
        >
          <span className="switch-thumb" />
        </button>
      </div>
      <p className="muted">
        After replying, guests can order aso-ebi. You receive the full price; Paystack’s fee is added on top for them. You
        see who ordered what, with their phone number.
      </p>
      {error && <p role="alert" className="alert">{error}</p>}
      {!data.configured && <p className="hint">Payments aren’t set up on this server yet.</p>}
      {data.configured && !data.hasPayout && (
        <p className="hint">
          Payments go to the account you add under <Link to="/app/gifts">Cash gifts</Link>.
        </p>
      )}
      {data.items.length === 0 && <p className="hint">Add an item first.</p>}
    </section>
  )
}

const STATUS_LABEL = { success: 'Paid', pending: 'Processing', failed: 'Didn’t go through', abandoned: 'Cancelled' } as const

function Orders({ data }: { data: AsoEbiOverview }) {
  if (data.orders.length === 0) return null
  return (
    <section className="card" aria-labelledby="orders-title">
      <h2 id="orders-title">Orders</h2>
      <ul className="gift-list">
        {data.orders.map((o) => (
          <li key={o.id}>
            <span className="gift-name">
              {o.guestName}
              <span className="hint">
                {quantityLabel(o.quantity, o.unit)} of {o.itemName} ·{' '}
                {new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                  new Date(o.paidAt ?? o.createdAt),
                )}
              </span>
              <span className="hint">
                <a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`}>{o.phone}</a> · {o.guestEmail}
              </span>
            </span>
            <span
              className={
                o.status === 'success' ? 'gift-amount' : `gift-amount gift-amount--muted${o.status === 'failed' ? ' gift-amount--failed' : ''}`
              }
            >
              {formatNaira(o.amount)}
            </span>
            <span className={o.status === 'success' ? 'badge badge--live' : 'badge'}>{STATUS_LABEL[o.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
