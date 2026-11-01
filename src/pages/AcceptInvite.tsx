import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { withNext } from '../lib/nav.ts'
import type { Session } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type Lookup = { inviterName: string | null; expiresAt: string }

export default function AcceptInvite() {
  useTitle('Partner invite')
  const { token = '' } = useParams()
  const { state, refresh } = useAuth()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<Lookup | 'invalid' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get<Lookup>(`/invites/${encodeURIComponent(token)}`).then(
      (data) => !cancelled && setInvite(data),
      () => !cancelled && setInvite('invalid'),
    )
    return () => {
      cancelled = true
    }
  }, [token])

  async function accept() {
    setBusy(true)
    setError(null)
    try {
      await refresh(await api.post<Session>(`/invites/${encodeURIComponent(token)}/accept`))
      navigate('/app', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const here = `/partner/accept/${token}`

  return (
    <main id="main" className="page">
      <Link to="/" className="brand">Alárinà</Link>
      <div className="card">
        {invite === null || state.status === 'loading' ? (
          <p className="muted">Checking your invite…</p>
        ) : invite === 'invalid' ? (
          <>
            <h1>Invite not valid</h1>
            <p>This link has expired, was already used, or was replaced by a newer one. Ask your partner to send a new link.</p>
            <Link to="/" className="btn btn--secondary">Go home</Link>
          </>
        ) : (
          <>
            <h1>{invite.inviterName ? `${invite.inviterName} invited you` : 'You’ve been invited'}</h1>
            <p className="muted">Join their wedding space to plan the invitation, track RSVPs and manage gifts together.</p>
            {error && <p role="alert" className="alert">{error}</p>}
            {state.status === 'signedIn' ? (
              <>
                <p>Joining as <strong>{state.user.name}</strong> ({state.user.email}).</p>
                <button className="btn btn--block" onClick={accept} disabled={busy}>{busy ? 'Joining…' : 'Accept invite'}</button>
              </>
            ) : (
              <div className="actions">
                <Link to={withNext('/signup', here)} className="btn">Create account</Link>
                <Link to={withNext('/signin', here)} className="btn btn--secondary">Sign in</Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
