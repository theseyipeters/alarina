import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import PayoutAccount from '../components/PayoutAccount.tsx'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira } from '../lib/money.ts'
import type { GiftsOverview } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'none' } | { status: 'ready'; data: GiftsOverview }

/** Cash gifts: where the money goes, whether guests are offered it, and what has come in. */
export default function CashGifts() {
  useTitle('Cash gifts')
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<GiftsOverview>('/wedding/gifts').then(
        (data) => setState({ status: 'ready', data }),
        (err: unknown) =>
          setState(err instanceof ApiError && err.code === 'no_wedding' ? { status: 'none' } : { status: 'error', message: errorMessage(err) }),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  if (state.status === 'loading') return <Loading label="Loading cash gifts" />
  if (state.status === 'error') return <LoadError title="Cash gifts didn’t load" message={state.message} onRetry={load} />
  if (state.status === 'none') {
    return (
      <EmptyState card icon="list" title="Set up your wedding first" action={<Link to="/app/setup" className="btn">Set up your wedding</Link>}>
        Cash gifts need your names, date and venue. Come back here once they’re in.
      </EmptyState>
    )
  }

  const { data } = state
  if (!data.configured) {
    return (
      <div className="card">
        <h1>Cash gifts</h1>
        <p className="muted">
          Cash gifts aren’t available on this server yet. They need a Paystack account to be connected
          (PAYSTACK_SECRET_KEY in the API’s settings).
        </p>
      </div>
    )
  }

  return (
    <div className="gifts">
      <header className="gifts-hero">
        <div>
          <p className="eyebrow">Received so far</p>
          <p className="gifts-total">{formatNaira(data.totals.received)}</p>
          <p className="muted">
            {data.totals.count === 0
              ? 'No gifts yet.'
              : `From ${data.totals.count} ${data.totals.count === 1 ? 'guest' : 'guests'}.`}{' '}
            Paid straight into your account by Paystack.
          </p>
        </div>
        <span className={data.enabled ? 'badge badge--live' : 'badge'}>{data.enabled ? 'Open to guests' : 'Off'}</span>
      </header>

      <div className="gifts-grid">
        <PayoutAccount
          payout={data.payout}
          onSaved={load}
          paths={{ banks: '/wedding/gifts/banks', resolve: '/wedding/gifts/account/resolve', save: '/wedding/gifts/account' }}
          title="Where gifts go"
          intro="Gifts are paid into a Nigerian bank account. We check the name on it before saving."
          passwordHint="To keep gifts safe, we check it’s you. We’ll email everyone in your wedding space about this change."
        />
        <GiftSwitch data={data} onChange={load} />
      </div>

      <GiftList data={data} />
    </div>
  )
}

const SWITCH_ERRORS: Record<string, string> = {
  fees_not_confirmed:
    'Gifts can’t be switched on yet: payment fees still need confirming on the server (PAYSTACK_FEES_CONFIRMED).',
  no_payout_account: 'Add the account gifts should go to first.',
}

function GiftSwitch({ data, onChange }: { data: GiftsOverview; onChange: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      await api.patch('/wedding/gifts', { enabled: !data.enabled })
      onChange()
    } catch (err) {
      setError(err instanceof ApiError ? (SWITCH_ERRORS[err.code] ?? err.message) : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="switch-title">
      <div className="switch-row">
        <h2 id="switch-title">Offer cash gifts to guests</h2>
        <button
          type="button"
          role="switch"
          aria-checked={data.enabled}
          aria-labelledby="switch-title"
          className="switch"
          onClick={toggle}
          disabled={busy}
        >
          <span className="switch-thumb" />
        </button>
      </div>
      <p className="muted">
        After replying, guests can send a cash gift. They choose what you receive; Paystack’s fee is added on top for them, so
        you get the full amount.
      </p>
      {error && <p role="alert" className="alert">{error}</p>}
      {!data.payout && <p className="hint">Add your account first.</p>}
    </section>
  )
}

const STATUS_LABEL = { success: 'Received', pending: 'Processing', failed: 'Didn’t go through', abandoned: 'Cancelled' } as const

function GiftList({ data }: { data: GiftsOverview }) {
  if (data.contributions.length === 0) return null
  return (
    <section className="card" aria-labelledby="gift-list-title">
      <h2 id="gift-list-title">Cash gifts</h2>
      <ul className="gift-list">
        {data.contributions.map((c) => (
          <li key={c.id}>
            <span className="gift-name">
              {c.guestName}
              <span className="hint">
                {new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                  new Date(c.paidAt ?? c.createdAt),
                )}
              </span>
            </span>
            <span
              className={
                c.status === 'success' ? 'gift-amount' : `gift-amount gift-amount--muted${c.status === 'failed' ? ' gift-amount--failed' : ''}`
              }
            >
              {formatNaira(c.amount)}
            </span>
            <span className={c.status === 'success' ? 'badge badge--live' : 'badge'}>{STATUS_LABEL[c.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
