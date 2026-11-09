import { Navigate, Outlet, useLocation } from 'react-router'
import { withNext } from '../lib/nav.ts'
import { useAuth } from './useAuth.ts'

/**
 * Gate for signed-in routes. Remembers where the visitor was headed so sign-in can return them.
 * Couples' pages and vendors' pages each send the other kind of account to their own dashboard.
 */
export default function RequireAuth({ kind = 'couple' }: { kind?: 'couple' | 'vendor' }) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return <p className="page muted">Loading…</p>
  if (state.status === 'signedOut') {
    return <Navigate to={withNext('/signin', location.pathname + location.search)} replace />
  }
  if (kind === 'couple' && state.status === 'vendor') return <Navigate to="/vendor" replace />
  if (kind === 'vendor' && state.status === 'signedIn') return <Navigate to="/app" replace />
  return <Outlet />
}
