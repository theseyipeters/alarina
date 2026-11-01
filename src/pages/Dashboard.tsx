import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { useTitle } from '../lib/useTitle.ts'

// Placeholder shell; the guided setup (Phase 2) and the real dashboard (Phase 4) replace it.
export default function Dashboard() {
  useTitle('Your wedding')
  const { state, signOut } = useAuth()
  const navigate = useNavigate()
  if (state.status !== 'signedIn') return null
  const { user, couple } = state

  return (
    <main id="main" className="page page--wide">
      <div className="row">
        <Link to="/" className="brand" style={{ margin: 0 }}>Alárinà</Link>
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
      <div className="card">
        <h1>Welcome, {user.name}</h1>
        {couple.partner ? (
          <p>You’re planning together with {couple.partner.name}.</p>
        ) : (
          <p>
            Your partner hasn’t joined yet. <Link to="/partner">Invite them</Link>
          </p>
        )}
        <p className="muted" style={{ marginBottom: 0 }}>Wedding setup is coming next.</p>
      </div>
    </main>
  )
}
