import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { homeFor } from '../auth/AuthContext.ts'
import { useAuth } from '../auth/useAuth.ts'
import { errorMessage } from '../lib/errors.ts'
import { safeNext, withNext } from '../lib/nav.ts'
import { useTitle } from '../lib/useTitle.ts'
import AuthLayout from '../components/AuthLayout.tsx'

export default function SignIn() {
  useTitle('Sign in')
  const { state, signIn } = useAuth()
  const navigate = useNavigate()
  const next = safeNext(useSearchParams()[0].get('next'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Kept so "Forgot password?" can carry it over.
  const [email, setEmail] = useState('')

  if ((state.status === 'signedIn' || state.status === 'vendor') && !busy) return <Navigate to={next ?? homeFor(state)} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await signIn({ email, password: String(form.get('password')) })
      // Without a destination, the redirect above sends each kind of account to its own dashboard.
      if (next) navigate(next, { replace: true })
      else setBusy(false)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card">
        <h1>Sign in</h1>
        {error && <p role="alert" className="alert">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" state={{ email }}>Forgot password?</Link>
            </div>
            <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Your password" />
          </div>
          <button className="btn btn--block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="form-footer">
          New here? <Link to={withNext('/signup', next)}>Create an account</Link>
          {' · '}
          <Link to={withNext('/signup?as=vendor', next)}>Join as a vendor</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
