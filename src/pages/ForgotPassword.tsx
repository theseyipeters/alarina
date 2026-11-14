import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import AuthLayout from '../components/AuthLayout.tsx'
import Field from '../components/Field.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { useTitle } from '../lib/useTitle.ts'

/**
 * Asks for an email and sends a reset link. The reply is the same whether or not there's an
 * account for it, so the page never says which addresses have signed up.
 */
export default function ForgotPassword() {
  useTitle('Forgot password')
  // Carried over from the sign-in form, if they'd typed it there.
  const [email, setEmail] = useState((useLocation().state as { email?: string } | null)?.email ?? '')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e?: FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post('/auth/password/forgot', { email })
      setSentTo(email)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card">
        {sentTo ? (
          <>
            <h1>Check your email</h1>
            <p role="status">
              If there’s an account for <strong className="break-anywhere">{sentTo}</strong>, we’ve sent it a link to choose a new
              password. The link works for an hour.
            </p>
            {error && <p role="alert" className="alert">{error}</p>}
            <p className="muted">
              Nothing yet? Check your spam folder, or{' '}
              <button type="button" className="link-button" onClick={() => send()} disabled={busy}>
                {busy ? 'sending…' : 'send another link'}
              </button>
              .
            </p>
          </>
        ) : (
          <>
            <h1>Forgot your password?</h1>
            <p className="muted">Enter the email you signed up with and we’ll send you a link to choose a new one.</p>
            {error && <p role="alert" className="alert">{error}</p>}
            <form onSubmit={send}>
              <Field label="Email">
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
              </Field>
              <button className="btn btn--block" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
            </form>
          </>
        )}
        <p className="form-footer">
          Remembered it? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
