import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import AuthLayout from '../components/AuthLayout.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatDate } from '../lib/format.ts'
import { withNext } from '../lib/nav.ts'
import { useTitle } from '../lib/useTitle.ts'

type Lookup = { inviterName: string | null; names: string; date: string | null; role: 'main' | 'co'; expiresAt: string }

/** A planner's invite link: see whose wedding it is, then accept with a planner account. */
export default function PlannerAccept() {
  useTitle('Planner invite')
  const { token = '' } = useParams()
  const { state } = useAuth()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<Lookup | 'invalid' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get<Lookup>(`/planner-invites/${encodeURIComponent(token)}`).then(
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
      const { weddingId } = await api.post<{ weddingId: string }>(`/planner-invites/${encodeURIComponent(token)}/accept`)
      navigate(`/vendor/weddings/${weddingId}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const here = `/planner/accept/${token}`

  return (
    <AuthLayout>
      <div className="card">
        {invite === null || state.status === 'loading' ? (
          <p className="muted">Checking your invite…</p>
        ) : invite === 'invalid' ? (
          <>
            <h1>Invite not valid</h1>
            <p className="muted">This link has expired or has already been used. Ask the couple for a new one.</p>
          </>
        ) : (
          <>
            <h1>{invite.role === 'main' ? `Lead the planning for ${invite.names}` : `Plan ${invite.names}’s wedding`}</h1>
            <p className="muted">
              {invite.inviterName ? `${invite.inviterName} invited you` : 'You’ve been invited'}
              {invite.date && `. The wedding is on ${formatDate(invite.date)}`}.
            </p>
            {error && <p role="alert" className="alert">{error}</p>}
            {state.status === 'vendor' ? (
              <button className="btn btn--block" onClick={accept} disabled={busy}>{busy ? 'Joining…' : 'Accept invite'}</button>
            ) : state.status === 'signedIn' ? (
              <p className="alert">You’re signed in as a couple. Sign out, then sign in with your planner account to accept.</p>
            ) : (
              <div className="stack">
                <Link className="btn btn--block" to={withNext('/signin', here)}>Sign in to accept</Link>
                <Link className="btn btn--secondary btn--block" to={withNext('/signup?as=vendor', here)}>Create a planner account</Link>
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
