import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import './Dashboard.css'

const TABS = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/responses', label: 'Responses', end: false },
  { to: '/app/share', label: 'Share', end: false },
]

/** Shell for the couple's dashboard. Each tab has its own URL, so it can be bookmarked and shared. */
export default function DashboardLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="page page--dashboard">
      <header className="row">
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
      </header>
      <nav className="tabs" aria-label="Dashboard">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className="tab">
            {t.label}
          </NavLink>
        ))}
      </nav>
      <main id="main">
        {/* Tabs load on demand; keep the header and tabs on screen while they do. */}
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
