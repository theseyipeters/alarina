import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { homeFor } from '../auth/AuthContext.ts'
import { useAuth } from '../auth/useAuth.ts'
import { errorMessage } from '../lib/errors.ts'
import { safeNext, withNext } from '../lib/nav.ts'
import { useTitle } from '../lib/useTitle.ts'
import { CATEGORY_IDS, VENDOR_CATEGORIES, type VendorCategory } from '../lib/vendors.ts'
import AuthLayout from '../components/AuthLayout.tsx'
import Logo from '../components/Logo.tsx'

export default function SignUp() {
  const [params] = useSearchParams()
  const asVendor = params.get('as') === 'vendor'
  useTitle(asVendor ? 'Join as a vendor' : 'Create your account')
  const { state, signUp } = useAuth()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if ((state.status === 'signedIn' || state.status === 'vendor') && !busy) return <Navigate to={next ?? homeFor(state)} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const account = { name: String(form.get('name')), email: String(form.get('email')), password: String(form.get('password')) }
    setBusy(true)
    setError(null)
    try {
      if (asVendor) {
        await signUp({
          ...account,
          kind: 'vendor',
          businessName: String(form.get('businessName')),
          category: String(form.get('category')) as VendorCategory,
        })
        // A planner arriving from a wedding's invite goes straight back to it.
        navigate(next ?? '/vendor', { replace: true })
      } else {
        await signUp(account)
        // Someone arriving from a partner invite goes straight back to it; a new couple invites their partner first.
        navigate(next ?? '/partner', { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <Link to="/" className="brand"><Logo /></Link>
      <div className="card">
        <h1>{asVendor ? 'Join as a vendor' : 'Create your account'}</h1>
        <p className="muted">
          {asVendor
            ? 'List your business where couples plan their weddings. Planners, venues, caterers, gift shops and more.'
            : 'You and your partner will share one wedding space.'}
        </p>
        {error && <p role="alert" className="alert">{error}</p>}
        <form onSubmit={onSubmit}>
          {asVendor && (
            <>
              <div className="field">
                <label htmlFor="businessName">Business name</label>
                <input id="businessName" name="businessName" type="text" autoComplete="organization" required maxLength={80} placeholder="Ìfẹ́ Events" />
              </div>
              <div className="field">
                <label htmlFor="category">What you do</label>
                <select id="category" name="category" required defaultValue="">
                  <option value="" disabled>Choose one</option>
                  {CATEGORY_IDS.map((id) => (
                    <option key={id} value={id}>{VENDOR_CATEGORIES[id].label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" type="text" autoComplete="given-name" required maxLength={80} placeholder="Adaeze" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required minLength={8} maxLength={128} aria-describedby="password-hint" />
            <span id="password-hint" className="hint">At least 8 characters.</span>
          </div>
          <button className="btn btn--block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="form-footer">
          Already have an account? <Link to={withNext('/signin', next)}>Sign in</Link>
          {' · '}
          {asVendor ? (
            <Link to={withNext('/signup', next)}>Planning your own wedding?</Link>
          ) : (
            <Link to={withNext('/signup?as=vendor', next)}>Join as a vendor</Link>
          )}
        </p>
      </div>
    </AuthLayout>
  )
}
