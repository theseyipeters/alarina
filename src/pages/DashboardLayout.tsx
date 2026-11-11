import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import './Dashboard.css'
import Logo from '../components/Logo.tsx'
import { useGiftsAccess } from '../lib/useGiftsAccess.ts'
import { Loading } from '../components/States.tsx'

const TABS = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/responses', label: 'Responses', end: false },
  { to: '/app/share', label: 'Share', end: false },
  { to: '/app/gifts', label: 'Gifts', end: false },
  { to: '/app/vendors', label: 'Vendors', end: false },
  { to: '/app/budget', label: 'Budget', end: false },
]

/** Shell for the couple's dashboard. Each tab has its own URL, so it can be bookmarked and shared. */
export default function DashboardLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { access } = useGiftsAccess()

  return (
    <div className="page page--dashboard">
      <header className="row">
        <Link to="/app" className="brand"><Logo /></Link>
        <div className="row row--tight">
          <Link to="/marketplace" className="link-button" data-tour="marketplace">Marketplace</Link>
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
      </header>
      <nav className="tabs" aria-label="Dashboard">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className="tab" data-tour={`tab-${t.label.toLowerCase()}`}>
            {t.label}
            {t.to === '/app/gifts' && access && !access.unlocked && !access.closed && <span className="tab-flag">Locked</span>}
          </NavLink>
        ))}
      </nav>
      <main id="main">
        {/* Tabs load on demand; keep the header and tabs on screen while they do. */}
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
