import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth.ts'
import Logo from '../../components/Logo.tsx'
import { STATUS_LABELS } from '../../lib/vendors.ts'
import '../Dashboard.css'
import './vendor.css'

/** Shell for a vendor's dashboard. Planners also get Weddings, where they plan alongside couples. */
export default function VendorLayout() {
  const { state, signOut } = useAuth()
  const navigate = useNavigate()
  if (state.status !== 'vendor') return null
  const { vendor } = state

  const tabs = [
    { to: '/vendor', label: 'Listing', end: true },
    ...(vendor.category === 'planner' ? [{ to: '/vendor/weddings', label: 'Weddings', end: false }] : []),
    { to: '/vendor/enquiries', label: 'Enquiries', end: false },
    ...(vendor.category === 'gifts' ? [{ to: '/vendor/orders', label: 'Orders', end: false }] : []),
    { to: '/vendor/payouts', label: 'Payouts', end: false },
  ]

  return (
    <div className="page page--dashboard">
      <header className="row">
        <Link to="/vendor" className="brand"><Logo /></Link>
        <div className="row row--tight">
          <span className={vendor.status === 'approved' ? 'badge badge--live' : vendor.status === 'rejected' ? 'badge badge--warn' : 'badge'}>
            {STATUS_LABELS[vendor.status]}
          </span>
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
      <p className="vendor-name">{vendor.businessName}</p>
      <nav className="tabs" aria-label="Vendor dashboard">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className="tab" data-tour={`vendor-tab-${t.label.toLowerCase()}`}>
            {t.label}
            {t.to === '/vendor/payouts' && !vendor.hasPayout && <span className="tab-flag">Add account</span>}
          </NavLink>
        ))}
      </nav>
      <main id="main">
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
