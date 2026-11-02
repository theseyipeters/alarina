import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { errorMessage } from '../lib/errors.ts'
import { safeNext, withNext } from '../lib/nav.ts'
import { useTitle } from '../lib/useTitle.ts'
import AuthLayout from '../components/AuthLayout.tsx'

export default function SignUp() {
  useTitle('Create your account')
  const { state, signUp } = useAuth()
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
      await signUp({
        name: String(form.get('name')),
        email: String(form.get('email')),
        password: String(form.get('password')),
      })
      // Someone arriving from a partner invite goes straight back to it; a new couple invites their partner first.
      navigate(next ?? '/partner', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <Link to="/" className="brand">Alárinà</Link>
      <div className="card">
        <h1>Create your account</h1>
        <p className="muted">You and your partner will share one wedding space.</p>
        {error && <p role="alert" className="alert">{error}</p>}
        <form onSubmit={onSubmit}>
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
        </p>
      </div>
    </AuthLayout>
  )
}
