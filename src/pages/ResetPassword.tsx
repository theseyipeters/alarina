import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import AuthLayout from '../components/AuthLayout.tsx'
import Field from '../components/Field.tsx'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import type { Session } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type Status = 'checking' | 'ready' | 'invalid' | 'done'

/** Where the reset email's link lands: choose a new password, then carry on signed in. */
export default function ResetPassword() {
  const { token = '' } = useParams()
  const { refresh } = useAuth()
  const [status, setStatus] = useState<Status>('checking')
  useTitle(status === 'invalid' ? 'Reset link expired' : status === 'done' ? 'Password changed' : 'Choose a new password')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check the link first, so nobody types a new password into a link that's already dead.
  useEffect(() => {
    let cancelled = false
    api.get(`/auth/password/reset/${encodeURIComponent(token)}`).then(
      () => !cancelled && setStatus('ready'),
      (err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.code === 'reset_link_invalid') setStatus('invalid')
        else {
          // Couldn't check (offline, rate limited): let them try; the save checks again.
          setStatus('ready')
          setError(errorMessage(err))
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [token])

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await refresh(await api.post<Session>('/auth/password/reset', { token, password }))
      setStatus('done')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'reset_link_invalid') setStatus('invalid')
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card">
        {status === 'checking' && <p className="muted">Checking your link…</p>}

        {status === 'invalid' && (
          <>
            <h1>This link has expired</h1>
            <p className="muted">
              Reset links work once, for an hour. If you asked more than once, only the newest link works.
            </p>
            <Link to="/forgot-password" className="btn btn--block">Send a new link</Link>
          </>
        )}

        {status === 'ready' && (
          <>
            <h1>Choose a new password</h1>
            <p className="muted">You’ll be signed out everywhere else once it’s saved.</p>
            {error && <p role="alert" className="alert">{error}</p>}
            <form onSubmit={save}>
              <Field label="New password" hint="At least 8 characters.">
                {(p) => (
                  <div className="password-field">
                    <input
                      {...p}
                      type={show ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="link-button password-toggle"
                      aria-pressed={show}
                      onClick={() => setShow(!show)}
                    >
                      {show ? 'Hide' : 'Show'}
                    </button>
                  </div>
                )}
              </Field>
              <button className="btn btn--block" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
            </form>
          </>
        )}

        {status === 'done' && (
          <>
            <h1>Password changed</h1>
            <p role="status" className="muted">
              You’re signed in with your new password, and signed out on every other device.
            </p>
            <Link to="/app" className="btn btn--block">Go to your wedding</Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
