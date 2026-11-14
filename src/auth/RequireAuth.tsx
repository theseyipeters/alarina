import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadError, Loading } from '../components/States.tsx'
import { withNext } from '../lib/nav.ts'
import { useAuth } from './useAuth.ts'

/**
 * Gate for signed-in routes. Remembers where the visitor was headed so sign-in can return them.
 * Couples' pages and vendors' pages each send the other kind of account to their own dashboard.
 */
export default function RequireAuth({ kind = 'couple' }: { kind?: 'couple' | 'vendor' }) {
  const { state, refresh } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return <Loading page />
  if (state.status === 'unreachable') {
    return (
      <main id="main" className="page">
        <LoadError title="Alárinà didn’t load" message={state.message} onRetry={() => refresh().catch(() => {})} />
      </main>
    )
  }
  if (state.status === 'signedOut') {
    return (
      <Navigate
        to={withNext('/signin', location.pathname + location.search)}
        state={state.expired ? { expired: true } : undefined}
        replace
      />
    )
  }
  if (kind === 'couple' && state.status === 'vendor') return <Navigate to="/vendor" replace />
  if (kind === 'vendor' && state.status === 'signedIn') return <Navigate to="/app" replace />
  return <Outlet />
}
