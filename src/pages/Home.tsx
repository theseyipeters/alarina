import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { useTitle } from '../lib/useTitle.ts'

export default function Home() {
  useTitle('Wedding invitations and RSVPs')
  const { state } = useAuth()

  return (
    <main id="main" className="page">
      <h1>Alárinà</h1>
      <p className="muted">
        Create your wedding invitation, share it with a link, collect RSVPs and receive gifts, together with your partner.
      </p>
      <div className="actions">
        {state.status === 'signedIn' ? (
          <Link to="/app" className="btn">Go to your wedding</Link>
        ) : (
          <>
            <Link to="/signup" className="btn">Create account</Link>
            <Link to="/signin" className="btn btn--secondary">Sign in</Link>
          </>
        )}
      </div>
    </main>
  )
}
