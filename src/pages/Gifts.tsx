import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useTitle } from '../lib/useTitle.ts'
import './Gifts.css'

const KINDS = [
  { to: '/app/gifts', label: 'Cash gifts', end: true },
  { to: '/app/gifts/aso-ebi', label: 'Aso-ebi', end: false },
  { to: '/app/gifts/wishlist', label: 'Wishlist', end: false },
]

/** Gifts come in three kinds, each on its own URL: cash, aso-ebi and a wishlist. */
export default function Gifts() {
  useTitle('Gifts')

  return (
    <div className="gifts-shell">
      <nav className="tabs tabs--sub" aria-label="Kinds of gift">
        {KINDS.map((k) => (
          <NavLink key={k.to} to={k.to} end={k.end} className="tab">
            {k.label}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <Outlet />
      </Suspense>
    </div>
  )
}
