import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { errorMessage } from '../lib/errors.ts'
import { safeNext, withNext } from '../lib/nav.ts'
import { useTitle } from '../lib/useTitle.ts'

export default function SignIn() {
  useTitle('Sign in')
  const { state, signIn } = useAuth()
  const navigate = useNavigate()
  const next = safeNext(useSearchParams()[0].get('next'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (state.status === 'signedIn' && !busy) return <Navigate to={next ?? '/app'} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await signIn({ email: String(form.get('email')), password: String(form.get('password')) })
      navigate(next ?? '/app', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <main id="main" className="page">
      <Link to="/" className="brand">Alárinà</Link>
      <div className="card">
        <h1>Sign in</h1>
        {error && <p role="alert" className="alert">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Your password" />
          </div>
          <button className="btn btn--block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="form-footer">
          New here? <Link to={withNext('/signup', next)}>Create an account</Link>
        </p>
      </div>
    </main>
  )
}
