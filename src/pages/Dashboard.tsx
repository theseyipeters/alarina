import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { coupleNames, formatDate, formatTime } from '../lib/format.ts'
import type { Wedding } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import { STEPS } from '../setup/steps.ts'

export default function Dashboard() {
  useTitle('Your wedding')
  const { state, signOut } = useAuth()
  const [wedding, setWedding] = useWedding()
  const navigate = useNavigate()
  const justFinished = (useLocation().state as { justFinished?: 'published' | 'draft' } | null)?.justFinished

  if (state.status !== 'signedIn') return null
  const { couple } = state

  return (
    <main id="main" className="page page--wide">
      <div className="row">
        <Link to="/app" className="brand">Alárinà</Link>
        <button
          className="btn btn--secondary"
          onClick={async () => {
            await signOut()
            navigate('/', { replace: true })
          }}
        >
          Sign out
        </button>
      </div>

      {justFinished && (
        <p role="status" className="alert alert--success">
          {justFinished === 'published' ? 'Your invitation is published.' : 'Saved as a private draft. Publish whenever you’re ready.'}
        </p>
      )}

      {wedding.status === 'loading' && <p className="muted">Loading your wedding…</p>}
      {wedding.status === 'error' && <p role="alert" className="alert">Your wedding couldn’t be loaded. Refresh to try again.</p>}
      {wedding.status === 'ready' &&
        (wedding.wedding?.setupCompletedAt ? (
          <WeddingCard wedding={wedding.wedding} onChange={setWedding} />
        ) : (
          <div className="card">
            <h1>Set up your wedding</h1>
            <p className="muted">
              Answer a few questions, one at a time. Everything saves as you go, so you can stop and come back.
            </p>
            {wedding.wedding && (
              <p>
                You’re on step {Math.min(wedding.wedding.checkpoint, STEPS.length - 1) + 1} of {STEPS.length}.
              </p>
            )}
            <Link to="/app/setup" className="btn">{wedding.wedding ? 'Continue setup' : 'Start setup'}</Link>
          </div>
        ))}

      <div className="card section">
        <h2>Your partner</h2>
        {couple.partner ? (
          <p>You’re planning together with {couple.partner.name}.</p>
        ) : (
          <p>
            Your partner hasn’t joined yet. <Link to="/partner">Invite them</Link>
          </p>
        )}
      </div>
    </main>
  )
}

function WeddingCard({ wedding, onChange }: { wedding: Wedding; onChange: (w: Wedding) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const published = wedding.status === 'published'
  const link = wedding.slug ? `${window.location.origin}/invite/${wedding.slug}` : null

  async function toggle() {
    setBusy(true)
    setError(null)
    setNotReady(false)
    try {
      const res = await api.post<{ wedding: Wedding }>(published ? '/wedding/unpublish' : '/wedding/publish')
      onChange(res.wedding)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_ready') setNotReady(true)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setError('Couldn’t copy automatically. Select the link and copy it.')
    }
  }

  return (
    <div className="card">
      <div className="row row--tight">
        <span className={`badge ${published ? 'badge--live' : ''}`}>{published ? 'Published' : 'Private draft'}</span>
        <Link to="/app/setup/names" className="btn btn--secondary">Edit details</Link>
      </div>
      <h1>{coupleNames(wedding.partnerOneName, wedding.partnerTwoName) || 'Your wedding'}</h1>
      <p className="muted">
        {[formatDate(wedding.date), formatTime(wedding.startTime)].filter(Boolean).join(' · ') || 'Date not set'}
        <br />
        {wedding.venueName ?? 'Venue not set'}
      </p>

      {error && <p role="alert" className="alert">{error}</p>}
      {notReady && (
        <p role="alert" className="alert">
          Some details are missing. <Link to="/app/setup/finish">Review your answers</Link> to publish.
        </p>
      )}

      {published && link && (
        <>
          <p>Share this link with your guests:</p>
          <div className="link-box">
            <input type="text" readOnly value={link} aria-label="Invitation link" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn btn--secondary" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </>
      )}

      <div className="actions">
        <button className={published ? 'btn btn--secondary' : 'btn'} onClick={toggle} disabled={busy}>
          {busy ? 'Saving…' : published ? 'Unpublish' : 'Publish invitation'}
        </button>
      </div>
      {published && (
        <p className="form-footer hint">
          Unpublishing hides the invitation from guests. The link stays the same if you publish again.
        </p>
      )}
    </div>
  )
}
