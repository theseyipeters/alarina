import type { ReactNode } from 'react'
import { Link } from 'react-router'
import HeroInvitation from './HeroInvitation.tsx'
import HeroVendor from './HeroVendor.tsx'
import Logo from './Logo.tsx'
import './AuthLayout.css'

export type Audience = 'couple' | 'vendor'

const ART: Record<Audience, { title: string; note: string }> = {
  couple: { title: 'Every invitation, every reply, in one place.', note: 'Made for Nigerian weddings, planned by two.' },
  vendor: { title: 'Be there when couples choose who makes their day.', note: 'Made for Nigerian weddings, and the people who make them.' },
}

const brand = (className: string) => (
  <Link to="/" className={`brand ${className}`} aria-label="Alárinà home">
    <Logo />
  </Link>
)

/**
 * Sign-in, sign-up and invite pages: the form on one side and, on wide screens, a paper panel
 * with the logo and an illustration on the other. The panel speaks to whoever the page is for:
 * couples see the envelope, vendors and planners a marketplace listing. On phones the panel is
 * hidden, so the logo sits above the form instead; only one of the two is ever shown.
 */
export default function AuthLayout({ children, audience = 'couple' }: { children: ReactNode; audience?: Audience }) {
  const { title, note } = ART[audience]
  return (
    <div className="auth">
      <div className="auth-art">
        {brand('auth-brand auth-brand--wide')}
        {/* Keyed, so the panel fades over to the other side when the choice changes. */}
        <div key={audience} className="auth-art-scene" aria-hidden="true">
          <p className="auth-art-title">{title}</p>
          {audience === 'vendor' ? <HeroVendor /> : <HeroInvitation />}
        </div>
        <p key={`${audience}-note`} className="auth-art-note" aria-hidden="true">{note}</p>
      </div>
      <main id="main" className="auth-main">
        <div className="auth-column">
          {brand('auth-brand auth-brand--narrow')}
          {children}
        </div>
      </main>
    </div>
  )
}
