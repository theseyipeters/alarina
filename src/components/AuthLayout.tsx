import type { ReactNode } from 'react'
import HeroInvitation from './HeroInvitation.tsx'
import './AuthLayout.css'

/**
 * Sign-in, sign-up and partner-invite pages: the form on one side and, on wide screens, an
 * emerald panel with the envelope animation on the other.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-art" aria-hidden="true">
        <p className="auth-art-title">Every invitation, every reply, in one place.</p>
        <div className="auth-art-scene">
          <HeroInvitation />
        </div>
        <p className="auth-art-note">Made for Nigerian weddings, planned by two.</p>
      </div>
      <main id="main" className="auth-main">
        <div className="auth-column">{children}</div>
      </main>
    </div>
  )
}
