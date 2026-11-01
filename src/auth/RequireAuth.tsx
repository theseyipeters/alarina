import { Navigate, Outlet, useLocation } from 'react-router'
import { withNext } from '../lib/nav.ts'
import { useAuth } from './useAuth.ts'

/** Gate for signed-in routes. Remembers where the visitor was headed so sign-in can return them. */
export default function RequireAuth() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return <p className="page muted">Loading…</p>
  if (state.status === 'signedOut') {
    return <Navigate to={withNext('/signin', location.pathname + location.search)} replace />
  }
  return <Outlet />
}
