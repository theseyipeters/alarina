import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import AmountInput from '../components/AmountInput.tsx'
import Field from '../components/Field.tsx'
import ImageField from '../components/ImageField.tsx'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'
import { api, ApiError, imageSrc } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira, nairaInput } from '../lib/money.ts'
import type { WishlistItem, WishlistOverview } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'
import { MAX_WISH_PRICE_NAIRA, MIN_WISH_PRICE_NAIRA } from '../lib/wishlist.ts'

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'none' } | { status: 'ready'; data: WishlistOverview }

/** Wishlist: the couple lists what they'd love with a price; guests pay for all of an item or chip in. */
export default function Wishlist() {
  useTitle('Wishlist')
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<WishlistOverview>('/wedding/gifts/wishlist').then(
        (data) => setState({ status: 'ready', data }),
        (err: unknown) =>
          setState(err instanceof ApiError && err.code === 'no_wedding' ? { status: 'none' } : { status: 'error', message: errorMessage(err) }),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  if (state.status === 'loading') return <Loading label="Loading wishlist" />
  if (state.status === 'error') return <LoadError title="Your wishlist didn’t load" message={state.message} onRetry={load} />
  if (state.status === 'none') {
    return (
      <EmptyState card icon="list" title="Set up your wedding first" action={<Link to="/app/setup" className="btn">Set up your wedding</Link>}>
        A wishlist needs your names, date and venue. Come back here once they’re in.
      </EmptyState>
    )
  }

  const { data } = state
  return (
    <div className="gifts">
      <header className="gifts-hero">
        <div>
          <p className="eyebrow">Wishlist gifts paid so far</p>
          <p className="gifts-total">{formatNaira(data.totals.received)}</p>
          <p className="muted">
            {data.totals.count === 0
              ? 'No gifts yet.'
              : `${data.totals.count} ${data.totals.count === 1 ? 'gift' : 'gifts'}.`}{' '}
            Paid straight into your account by Paystack.
          </p>
        </div>
        <span className={data.enabled ? 'badge badge--live' : 'badge'}>{data.enabled ? 'Open to guests' : 'Off'}</span>
      </header>

      <div className="gifts-grid">
        <Items items={data.items} onChange={load} />
        <WishlistSwitch data={data} onChange={load} />
      </div>

      <Gifts data={data} />
    </div>
  )
}

type Draft = { name: string; description: string; imageId: string | null; price: string }
const EMPTY: Draft = { name: '', description: '', imageId: null, price: '' }

function Items({ items, onChange }: { items: WishlistItem[]; onChange: () => void }) {
  // `null` is closed, 'new' is the add form, otherwise the id of the item being edited.
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [removing, setRemoving] = useState<WishlistItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  function askRemove(item: WishlistItem, trigger: HTMLElement) {
    returnFocusRef.current = trigger
    setRemoving(item)
    dialogRef.current?.showModal()
  }

  async function confirmRemove() {
    if (!removing) return
    try {
      await api.delete(`/wedding/gifts/wishlist/items/${removing.id}`)
      dialogRef.current?.close()
      onChange()
    } catch (err) {
      setError(errorMessage(err))
      dialogRef.current?.close()
    }
  }

  return (
    <section className="card" aria-labelledby="wish-items-title">
      <h2 id="wish-items-title">What you’d love</h2>
      <p className="muted">
        Add each item with its price. Guests can pay for it in full or chip in towards it. Or pick from the{' '}
        <Link to="/marketplace?tab=gifts">gift shop</Link>: the shop is paid and delivers it to you.
      </p>
      {error && <p role="alert" className="alert">{error}</p>}

      {items.length > 0 && (
        <ul className="item-list">
          {items.map((item) =>
            editing === item.id ? (
              <li key={item.id}>
                <ItemForm
                  initial={{ name: item.name, description: item.description, imageId: item.imageId, price: nairaInput(item.price) }}
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
                    {formatNaira(item.funded)} of {formatNaira(item.price)}
                    {item.funded >= item.price && ' · fully gifted'}
                  </span>
                  <progress className="meter" value={item.funded} max={item.price} aria-label={`${item.name} funded`} />
                  {item.description && <span className="hint">{item.description}</span>}
                  {item.vendorName && <span className="hint">From {item.vendorName}, who delivers it to you</span>}
                </span>
                </span>
                <span className="item-actions">
                  {/* The shop sets a gift-shop item's price and photo. */}
                  {!item.vendorName && (
                    <button type="button" className="link-button" onClick={() => setEditing(item.id)}>
                      Edit<span className="visually-hidden"> {item.name}</span>
                    </button>
                  )}
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
        aria-labelledby="remove-wish-title"
        onClose={() => {
          setRemoving(null)
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus()
          else document.getElementById('wish-items-title')?.focus()
        }}
      >
        <h2 id="remove-wish-title">Remove {removing?.name}?</h2>
        <p className="muted">
          Guests will no longer see it. Money already paid towards it stays in your list and in your account.
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
    if (!Number.isInteger(price) || price < MIN_WISH_PRICE_NAIRA || price > MAX_WISH_PRICE_NAIRA) {
      setError(`Enter a price between ${formatNaira(MIN_WISH_PRICE_NAIRA * 100)} and ${formatNaira(MAX_WISH_PRICE_NAIRA * 100)}.`)
      return
    }
    setBusy(true)
    setError(null)
    const body = { name: draft.name, description: draft.description, imageId: draft.imageId, price }
    try {
      if (itemId) await api.put(`/wedding/gifts/wishlist/items/${itemId}`, body)
      else await api.post('/wedding/gifts/wishlist/items', body)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="item-form">
      <Field label="Name" hint="For example, Air fryer.">
        {(p) => (
          <input {...p} type="text" required maxLength={80} autoFocus value={draft.name} onChange={(e) => set('name', e.target.value)} />
        )}
      </Field>
      <Field label="Price" hint={`From ${formatNaira(MIN_WISH_PRICE_NAIRA * 100)}. Guests pay Paystack’s fee on top.`}>
        {(p) => (
          <AmountInput {...p} required placeholder={85000} value={draft.price} onChange={(price) => set('price', price)} />
        )}
      </Field>
      <Field label="Details" optional hint="Brand, size, colour, anything that helps a guest.">
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
    'The wishlist can’t be switched on yet: payment fees still need confirming on the server (PAYSTACK_FEES_CONFIRMED).',
  no_payout_account: 'Add the account payments should go to first.',
  no_items: 'Add an item first.',
}

function WishlistSwitch({ data, onChange }: { data: WishlistOverview; onChange: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      await api.patch('/wedding/gifts/wishlist', { enabled: !data.enabled })
      onChange()
    } catch (err) {
      setError(err instanceof ApiError ? (SWITCH_ERRORS[err.code] ?? err.message) : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="wish-switch-title">
      <div className="switch-row">
        <h2 id="wish-switch-title">Share your wishlist</h2>
        <button
          type="button"
          role="switch"
          aria-checked={data.enabled}
          aria-labelledby="wish-switch-title"
          className="switch"
          onClick={toggle}
          disabled={busy}
        >
          <span className="switch-thumb" />
        </button>
      </div>
      <p className="muted">
        After replying, guests see your list with a progress bar on each item. You receive the full amount they give;
        Paystack’s fee is added on top for them. Once an item is fully paid for, guests see it’s taken.
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

function Gifts({ data }: { data: WishlistOverview }) {
  if (data.gifts.length === 0) return null
  return (
    <section className="card" aria-labelledby="wish-gifts-title">
      <h2 id="wish-gifts-title">Gifts</h2>
      <ul className="gift-list">
        {data.gifts.map((g) => (
          <li key={g.id}>
            <span className="gift-name">
              {g.guestName}
              <span className="hint">
                Towards {g.itemName} ·{' '}
                {new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                  new Date(g.paidAt ?? g.createdAt),
                )}
              </span>
            </span>
            <span
              className={
                g.status === 'success' ? 'gift-amount' : `gift-amount gift-amount--muted${g.status === 'failed' ? ' gift-amount--failed' : ''}`
              }
            >
              {formatNaira(g.amount)}
            </span>
            <span className={g.status === 'success' ? 'badge badge--live' : 'badge'}>{STATUS_LABEL[g.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
