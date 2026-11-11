import { useState } from 'react'
import { Link } from 'react-router'
import Logo from '../components/Logo.tsx'
import { getConsent, setConsent } from '../lib/analytics.ts'
import { useTitle } from '../lib/useTitle.ts'
import './CookiePolicy.css'

export default function CookiePolicy() {
  useTitle('Cookie Policy')
  const [choice, setChoice] = useState(getConsent)

  function choose(value: 'allowed' | 'declined') {
    const wasAllowed = choice === 'allowed'
    setConsent(value)
    setChoice(value)
    // Analytics already running in this tab only stops once the page reloads.
    if (value === 'declined' && wasAllowed) window.location.reload()
  }

  return (
    <main id="main" className="page page--wide policy">
      <Link to="/" className="brand"><Logo /></Link>

      <h1>Cookie Policy</h1>
      <p className="muted">How Alárinà uses cookies and analytics, in plain words.</p>

      <h2>What we use</h2>
      <p>
        <strong>A sign-in cookie.</strong> When you sign in, we set one cookie so you stay signed in. The site can’t work
        without it, so it doesn’t need your permission. We use it for nothing else.
      </p>
      <p>
        <strong>Analytics, only if you allow it.</strong> We use Umami to see which pages people visit and where they
        get stuck, so we can fix what doesn’t work.
      </p>

      <h2>What analytics does and doesn’t do</h2>
      <ul>
        <li>It sets no cookies and builds no profile of you.</li>
        <li>It records the page visited, where you came from, your browser, device type and country.</li>
        <li>It doesn’t record your name, email, what you type, or your screen. There are no session recordings.</li>
        <li>There are no ads, no ad trackers, and nothing is sold or shared for advertising.</li>
        <li>
          Guest pages are never measured. That covers invitation links and RSVP links, which belong to a private event
          and its guests.
        </li>
      </ul>

      <h2>Your choice</h2>
      <p className="policy-status" role="status">
        {choice === 'allowed' && 'Analytics is on for this browser.'}
        {choice === 'declined' && 'Analytics is off for this browser.'}
        {choice === null && 'You haven’t chosen yet. Analytics is off until you do.'}
      </p>
      <div className="actions">
        {choice !== 'allowed' && (
          <button type="button" className="btn" onClick={() => choose('allowed')}>Allow analytics</button>
        )}
        {choice !== 'declined' && (
          <button type="button" className="btn btn--secondary" onClick={() => choose('declined')}>{choice === null ? 'No thanks' : 'Turn off analytics'}</button>
        )}
      </div>
      <p className="muted">Your choice is saved in this browser only. You can change it here at any time.</p>

      <h2>Other companies</h2>
      <p>
        Payments are handled by Paystack. When you pay, you are on Paystack’s pages and their own policies apply. Our
        fonts are served from our own site, so no font provider sees your visit.
      </p>
    </main>
  )
}
