import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import CopyLink from '../components/CopyLink.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { useTitle } from '../lib/useTitle.ts'
import Logo from '../components/Logo.tsx'

type Created = { link: string; expiresAt: string; emailSent: boolean }

export default function InvitePartner() {
  useTitle('Invite your partner')
  const { state, refresh } = useAuth()
  const [created, setCreated] = useState<Created | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (state.status !== 'signedIn') return null
  const { partner, pendingInvite } = state.couple

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email')).trim()
    setBusy(true)
    setError(null)
    try {
      setCreated(await api.post<Created>('/couple/invites', email ? { email } : {}))
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const canContinue = Boolean(partner || created || pendingInvite)

  return (
    <main id="main" className="page">
      <Link to="/" className="brand"><Logo /></Link>
      <div className="card">
        <h1>Invite your partner</h1>
        {partner ? (
          <p>{partner.name} has joined your wedding space.</p>
        ) : (
          <>
            <p className="muted">
              Send your partner a private link. It works once and expires after a few days. You can carry on setting up
              before they accept.
            </p>
            {error && <p role="alert" className="alert">{error}</p>}
            <form onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="email">Partner’s email (optional)</label>
                <input id="email" name="email" type="email" autoComplete="off" placeholder="partner@example.com" aria-describedby="email-hint" />
                <span id="email-hint" className="hint">If email is set up, we’ll send the link. You can always copy it too.</span>
              </div>
              <button className="btn btn--secondary" disabled={busy}>
                {busy ? 'Creating link…' : created || pendingInvite ? 'Generate a new link' : 'Create invite link'}
              </button>
            </form>
            {created && (
              <div className="section">
                <p role="status" className="alert alert--success">
                  {created.emailSent ? 'Invite emailed. You can also share the link below.' : 'Invite link ready. Share it with your partner.'}
                </p>
                <CopyLink link={created.link} label="Invite link" />
              </div>
            )}
            {!created && pendingInvite && (
              <p className="form-footer">
                An invite is pending until {new Date(pendingInvite.expiresAt).toLocaleDateString()}. Links can’t be shown again, so generate a new one if you need to re-share.
              </p>
            )}
          </>
        )}
        <div className="actions section">
          {canContinue ? (
            <Link to="/app" className="btn">Continue</Link>
          ) : (
            <button className="btn" disabled>Continue</button>
          )}
        </div>
      </div>
    </main>
  )
}
