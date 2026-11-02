import { Suspense, useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useSearchParams } from 'react-router'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira } from '../lib/money.ts'
import { useTitle } from '../lib/useTitle.ts'
import './Gifts.css'

const KINDS = [
  { to: '/app/gifts', label: 'Cash gifts', end: true },
  { to: '/app/gifts/aso-ebi', label: 'Aso-ebi', end: false },
  { to: '/app/gifts/wishlist', label: 'Wishlist', end: false },
]

type Access = { unlocked: boolean; price: number; configured: boolean }

/**
 * Gifts come in three kinds, each on its own URL: cash, aso-ebi and a wishlist. They need a
 * one-time payment first; until then the page shows faded behind an Unlock Gifts prompt.
 */
export default function Gifts() {
  useTitle('Gifts')
  const [params, setParams] = useSearchParams()
  const reference = params.get('reference')
  const [access, setAccess] = useState<Access | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const loadAccess = useCallback(
    () =>
      api.get<Access>('/wedding/gifts/access').then(setAccess, () => setError(true)),
    [],
  )

  // Back from Paystack: confirm the payment with the server, then open Gifts or say what happened.
  useEffect(() => {
    if (!reference) {
      loadAccess()
      return
    }
    let cancelled = false
    api.post<{ status: string; unlocked: boolean }>('/wedding/gifts/unlock/verify', { reference }).then(
      ({ status, unlocked }) => {
        if (cancelled) return
        if (!unlocked && status !== 'success') {
          setMessage(
            status === 'pending'
              ? 'Paystack hasn’t confirmed your payment yet. This usually takes a few seconds, so try again shortly.'
              : 'Your payment didn’t go through. You haven’t been charged.',
          )
        }
        setParams({}, { replace: true })
        loadAccess()
      },
      (err) => {
        if (cancelled) return
        setMessage(errorMessage(err))
        setParams({}, { replace: true })
        loadAccess()
      },
    )
    return () => {
      cancelled = true
    }
  }, [reference, loadAccess, setParams])

  if (error) return <p role="alert" className="alert">Gifts couldn’t be loaded. Refresh to try again.</p>
  if (!access) return <p className="muted">{reference ? 'Confirming your payment…' : 'Loading gifts…'}</p>

  const content = (
    <div className="gifts-shell">
      <nav className="tabs tabs--sub" aria-label="Kinds of gift">
        {KINDS.map((k) => (
          <NavLink key={k.to} to={k.to} end={k.end} className="tab">
            {k.label}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <Outlet />
      </Suspense>
    </div>
  )

  if (access.unlocked) return content

  return (
    <div className="gifts-locked">
      {/* The real page, faded and out of reach, so the couple can see what they're unlocking. */}
      <div className="gifts-locked-preview" inert aria-hidden="true">
        {content}
      </div>
      <UnlockPrompt access={access} message={message} />
    </div>
  )
}

function UnlockPrompt({ access, message }: { access: Access; message: string | null }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function unlock() {
    setBusy(true)
    setError(null)
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>('/wedding/gifts/unlock')
      window.location.assign(checkoutUrl)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <section className="unlock card" aria-labelledby="unlock-title">
      <svg className="unlock-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <h2 id="unlock-title">Unlock Gifts</h2>
      <p className="muted">
        One payment of {formatNaira(access.price)}, once, for your whole wedding. Then guests can send you cash, order
        aso-ebi and give from your wishlist, and everything they give goes straight to your account.
      </p>
      {message && <p role="status" className="alert alert--info">{message}</p>}
      {error && <p role="alert" className="alert">{error}</p>}
      {!access.configured && <p className="hint">Payments aren’t set up on this server yet.</p>}
      <button type="button" className="btn" onClick={unlock} disabled={busy}>
        {busy ? 'Opening Paystack…' : `Unlock Gifts · ${formatNaira(access.price)}`}
      </button>
      <p className="hint">Secure payment by Paystack.</p>
    </section>
  )
}
