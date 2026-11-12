import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import Field from './Field.tsx'
import Select from './Select.tsx'

type Bank = { name: string; code: string }
type Resolved = { bankName: string; accountName: string }

export type Payout = { bankName: string; accountName: string; accountLast4: string } | null

type Props = {
  payout: Payout
  onSaved: () => void
  /** The API paths for the bank list, the account check and saving. */
  paths: { banks: string; resolve: string; save: string }
  title: string
  intro: string
  passwordHint: string
}

/**
 * Where payments are paid out: shown as a bank card once saved. Saving is two steps (check the
 * account's name, then confirm with the password), because it decides where money goes.
 * Couples use it for gifts, vendors for what couples and guests pay them.
 */
export default function PayoutAccount({ payout, onSaved, paths, title, intro, passwordHint }: Props) {
  const [editing, setEditing] = useState(!payout)
  const [banks, setBanks] = useState<Bank[] | null>(null)
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [resolved, setResolved] = useState<Resolved | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing || banks) return
    api.get<{ banks: Bank[] }>(paths.banks).then(
      ({ banks }) => setBanks([...banks].sort((a, b) => a.name.localeCompare(b.name))),
      (err) => setError(errorMessage(err)),
    )
  }, [editing, banks, paths.banks])

  async function check(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setResolved(await api.post<Resolved>(paths.resolve, { bankCode, accountNumber }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.put(paths.save, { bankCode, accountNumber, password })
      setEditing(false)
      setResolved(null)
      setAccountNumber('')
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPassword('')
      setBusy(false)
    }
  }

  function useDifferentAccount() {
    setResolved(null)
    setPassword('')
    setError(null)
  }

  return (
    <section className="card" aria-labelledby="payout-title">
      <h2 id="payout-title">{title}</h2>

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
          <p className="muted">{intro}</p>
          {error && <p role="alert" className="alert">{error}</p>}
          {resolved ? (
            <form className="resolved" onSubmit={save}>
              <p className="resolved-name">{resolved.accountName}</p>
              <p className="muted">
                {resolved.bankName} · ending {accountNumber.slice(-4)}
              </p>
              <p>Is this the right account?</p>
              <Field label="Your password" hint={passwordHint}>
                {(p) => (
                  <input
                    {...p}
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>
              <div className="actions">
                <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Yes, save account'}</button>
                <button type="button" className="btn btn--secondary" onClick={useDifferentAccount} disabled={busy}>
                  Use a different account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={check}>
              <Field label="Bank">
                {(p) => (
                  <Select
                    {...p}
                    required
                    value={bankCode}
                    onChange={setBankCode}
                    disabled={!banks}
                    placeholder={banks ? 'Choose your bank' : 'Loading banks…'}
                    options={(banks ?? []).map((b) => ({ value: b.code, label: b.name }))}
                  />
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
