import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Field from '../components/Field.tsx'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira } from '../lib/money.ts'
import type { GiftsOverview } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type State = { status: 'loading' } | { status: 'error' } | { status: 'none' } | { status: 'ready'; data: GiftsOverview }

/** Cash gifts: where the money goes, whether guests are offered it, and what has come in. */
export default function CashGifts() {
  useTitle('Cash gifts')
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<GiftsOverview>('/wedding/gifts').then(
        (data) => setState({ status: 'ready', data }),
        (err) => setState({ status: err instanceof ApiError && err.code === 'no_wedding' ? 'none' : 'error' }),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  if (state.status === 'loading') return <p className="muted">Loading cash gifts…</p>
  if (state.status === 'error') return <p role="alert" className="alert">Cash gifts couldn’t be loaded. Refresh to try again.</p>
  if (state.status === 'none') {
    return (
      <div className="card">
        <h1>Cash gifts</h1>
        <p className="muted">Set up your wedding first, then come back to receive cash gifts.</p>
      </div>
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
        <PayoutAccount payout={data.payout} onSaved={load} />
        <GiftSwitch data={data} onChange={load} />
      </div>

      <GiftList data={data} />
    </div>
  )
}

type Bank = { name: string; code: string }
type Resolved = { bankName: string; accountName: string }

function PayoutAccount({ payout, onSaved }: { payout: GiftsOverview['payout']; onSaved: () => void }) {
  const [editing, setEditing] = useState(!payout)
  const [banks, setBanks] = useState<Bank[] | null>(null)
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [resolved, setResolved] = useState<Resolved | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing || banks) return
    api.get<{ banks: Bank[] }>('/wedding/gifts/banks').then(
      ({ banks }) => setBanks([...banks].sort((a, b) => a.name.localeCompare(b.name))),
      (err) => setError(errorMessage(err)),
    )
  }, [editing, banks])

  async function check(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setResolved(await api.post<Resolved>('/wedding/gifts/account/resolve', { bankCode, accountNumber }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await api.put('/wedding/gifts/account', { bankCode, accountNumber })
      setEditing(false)
      setResolved(null)
      setAccountNumber('')
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="payout-title">
      <h2 id="payout-title">Where gifts go</h2>

      {payout && !editing && (
        <>
          {/* Shown like a bank card: only the name, bank and last four digits are ever stored. */}
          <div className="bank-card" aria-label={`${payout.accountName}, ${payout.bankName}, account ending ${payout.accountLast4}`}>
            <span className="bank-card-bank">{payout.bankName}</span>
            <span className="bank-card-number" aria-hidden="true">•••• •••• {payout.accountLast4}</span>
            <span className="bank-card-name">{payout.accountName}</span>
          </div>
          <button type="button" className="btn btn--secondary" onClick={() => setEditing(true)}>Change account</button>
        </>
      )}

      {editing && (
        <>
          <p className="muted">Gifts are paid into a Nigerian bank account. We check the name on it before saving.</p>
          {error && <p role="alert" className="alert">{error}</p>}
          {resolved ? (
            <div className="resolved">
              <p className="resolved-name">{resolved.accountName}</p>
              <p className="muted">
                {resolved.bankName} · ending {accountNumber.slice(-4)}
              </p>
              <p>Is this the right account?</p>
              <div className="actions">
                <button type="button" className="btn" onClick={save} disabled={busy}>
                  {busy ? 'Saving…' : 'Yes, save account'}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => setResolved(null)} disabled={busy}>
                  Use a different account
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={check}>
              <Field label="Bank">
                {(p) => (
                  <select {...p} required value={bankCode} onChange={(e) => setBankCode(e.target.value)} disabled={!banks}>
                    <option value="" disabled>{banks ? 'Choose your bank' : 'Loading banks…'}</option>
                    {banks?.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Account number" hint="10 digits (NUBAN).">
                {(p) => (
                  <input
                    {...p}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    pattern="\d{10}"
                    maxLength={10}
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  />
                )}
              </Field>
              <div className="actions">
                <button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Check account'}</button>
                {payout && (
                  <button type="button" className="btn btn--secondary" onClick={() => setEditing(false)}>Cancel</button>
                )}
              </div>
            </form>
          )}
        </>
      )}
    </section>
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
