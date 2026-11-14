import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getConsent, isPrivatePath, loadAnalytics, setConsent } from '../lib/analytics.ts'
import './ConsentBanner.css'

// Loads analytics on startup if the visitor already said yes; otherwise asks once.
if (typeof window !== 'undefined' && getConsent() === 'allowed') loadAnalytics()

export default function ConsentBanner() {
  const { pathname } = useLocation()
  const [answered, setAnswered] = useState(() => getConsent() !== null)

  // The Cookie Policy page has its own controls, so the banner stays out of its way.
  if (answered || isPrivatePath(pathname) || pathname === '/cookies') return null

  function answer(value: 'allowed' | 'declined') {
    setConsent(value)
    setAnswered(true)
  }

  return (
    <section className="consent" aria-label="Analytics">
      <p>
        Can we use analytics to see what works and fix what doesn’t? No ads, no session recordings, and nothing is
        sold. <Link to="/cookies">Cookie Policy</Link>
      </p>
      <div className="consent__actions">
        <button type="button" className="btn" onClick={() => answer('allowed')}>Allow</button>
        <button type="button" className="btn btn--secondary" onClick={() => answer('declined')}>No thanks</button>
      </div>
    </section>
  )
}
