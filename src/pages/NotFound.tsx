import { Link, useLocation } from 'react-router'
import { homeFor } from '../auth/AuthContext.ts'
import { useAuth } from '../auth/useAuth.ts'
import Logo from '../components/Logo.tsx'
import { useTitle } from '../lib/useTitle.ts'
import './NotFound.css'

/** The address they tried, readable: decoded where possible, without the scheme. */
function addressTried(pathname: string, search: string) {
  let path = pathname + search
  try {
    path = decodeURI(path)
  } catch {
    // Malformed escapes: show it as typed.
  }
  return `${window.location.host}${path}`
}

/**
 * 404: an envelope that came back, addressed to the page they tried, with a
 * "Return to sender" postmark. The envelope rises in and the postmark lands;
 * with reduced motion both are simply there.
 */
export default function NotFound() {
  useTitle('Page not found')
  const { state } = useAuth()
  const { pathname, search } = useLocation()
  const signedIn = state.status === 'signedIn' || state.status === 'vendor'

  return (
    <main id="main" className="page lost">
      <Link to="/" className="brand lost-brand">
        <Logo />
      </Link>

      <div className="lost-envelope" aria-hidden="true">
        <svg className="lost-flap" viewBox="0 0 100 60" preserveAspectRatio="none">
          <polyline points="0,0 50,34 100,0" />
        </svg>
        <span className="lost-stamp">
          <span className="lost-stamp-face">
            <Logo variant="mark" />
          </span>
        </span>
        <div className="lost-address">
          <span className="lost-to">To</span>
          <span className="lost-path">{addressTried(pathname, search)}</span>
        </div>
        <span className="lost-postmark">
          <span>Return to sender</span>
          <span className="lost-postmark-code">No such page · 404</span>
        </span>
      </div>

      <h1>This page got lost in the post</h1>
      <p className="lost-body">
        The link may be mistyped, or the page has moved. If someone sent you an invitation, ask them to send the link again.
      </p>
      <div className="actions lost-actions">
        <Link to={signedIn ? homeFor(state) : '/'} className="btn">
          {signedIn ? 'Go to your dashboard' : 'Go to the start'}
        </Link>
        <Link to="/marketplace" className="btn btn--secondary">
          Browse the marketplace
        </Link>
      </div>
    </main>
  )
}
