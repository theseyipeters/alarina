import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { withNext } from '../lib/nav.ts'
import type { Session } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'
import AuthLayout from '../components/AuthLayout.tsx'
import Logo from '../components/Logo.tsx'

type Lookup = { inviterName: string | null; expiresAt: string }

export default function AcceptInvite() {
  useTitle('Partner invite')
  const { token = '' } = useParams()
  const { state, refresh } = useAuth()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<Lookup | 'invalid' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

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

  async function accept(discardOwnWedding = false) {
    setBusy(true)
    setError(null)
    try {
      const body = discardOwnWedding ? { discardOwnWedding } : undefined
      await refresh(await api.post<Session>(`/invites/${encodeURIComponent(token)}/accept`, body))
      navigate('/app', { replace: true })
    } catch (err) {
      // They started their own setup before joining: confirm before throwing that draft away.
      if (err instanceof ApiError && err.code === 'own_wedding_draft') setConfirmDiscard(true)
      else setError(errorMessage(err))
      setBusy(false)
    }
  }

  const here = `/partner/accept/${token}`

  return (
    <AuthLayout>
      <Link to="/" className="brand"><Logo /></Link>
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
                <p>Joining as {state.user.name} ({state.user.email}).</p>
                {confirmDiscard ? (
                  <>
                    <p role="alert" className="alert">
                      You’ve already started setting up your own wedding. Joining your partner’s space will discard
                      those answers.
                    </p>
                    <div className="actions">
                      <button className="btn" onClick={() => accept(true)} disabled={busy}>
                        {busy ? 'Joining…' : 'Discard my draft and join'}
                      </button>
                      <Link to="/app" className="btn btn--secondary">Keep my draft</Link>
                    </div>
                  </>
                ) : (
                  <button className="btn btn--block" onClick={() => accept()} disabled={busy}>
                    {busy ? 'Joining…' : 'Accept invite'}
                  </button>
                )}
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
    </AuthLayout>
  )
}
