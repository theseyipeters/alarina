import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import HeroInvitation from '../components/HeroInvitation.tsx'
import { useTitle } from '../lib/useTitle.ts'
import './Home.css'

const STEPS = [
  {
    title: 'Set up together',
    body: 'Create your space and invite your partner. Answer one question at a time, and everything saves as you go.',
  },
  {
    title: 'Design and publish',
    body: 'Choose a layout and colours, preview it on a phone and a laptop, then publish when it feels right.',
  },
  {
    title: 'Share one link',
    body: 'Send it on WhatsApp, by text or in your family groups. Guests reply in under a minute and can change their answer later.',
  },
]

const FEATURES = [
  {
    title: 'Planned by two',
    body: 'You and your partner share one wedding space, with the same access to everything.',
  },
  {
    title: 'No accounts for guests',
    body: 'Guests open the link, read the details and reply. Nothing to download, nothing to sign up for.',
  },
  {
    title: 'Know who’s coming',
    body: 'See who has accepted and declined, and which side of the family each reply came through.',
  },
  {
    title: 'Cash gifts, simply',
    body: 'After replying, guests can send a gift. It goes straight to your Nigerian bank account through Paystack.',
  },
  {
    title: 'Names spelt right',
    body: 'Ọláolúwa, not Olaoluwa. Every accent and under-dot shows exactly as you type it.',
  },
  {
    title: 'Private until you publish',
    body: 'Your invitation stays hidden until you publish it, and guest details are visible only to the two of you.',
  },
]

export default function Home() {
  useTitle('Wedding invitations and RSVPs')
  const { state } = useAuth()
  const signedIn = state.status === 'signedIn'

  const primaryCta = signedIn ? (
    <Link to="/app" className="btn">Go to your wedding</Link>
  ) : (
    <Link to="/signup" className="btn">Create your invitation</Link>
  )

  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" className="brand">Alárinà</Link>
        <nav className="landing-nav" aria-label="Account">
          {signedIn ? (
            <Link to="/app" className="btn btn--secondary">Your wedding</Link>
          ) : (
            <>
              <Link to="/signin" className="landing-signin">Sign in</Link>
              <Link to="/signup" className="btn btn--secondary hide-sm">Create account</Link>
            </>
          )}
        </nav>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">Wedding invitations for Nigerian couples</p>
            <h1 id="hero-title">One link for your invitation, RSVPs and gifts</h1>
            <p className="hero-lead">
              Design your wedding invitation together, share it anywhere, and see who’s coming. Guests reply from their
              phone in under a minute, with no account.
            </p>
            <div className="actions">
              {primaryCta}
              <a href="#how" className="btn btn--secondary">See how it works</a>
            </div>
            <p className="hero-note">Your invitation stays private until you choose to publish it.</p>
          </div>

          <div className="hero-figure">
            <HeroInvitation />
          </div>
        </section>

        <section id="how" className="landing-section" aria-labelledby="how-title">
          <div className="section-head">
            <h2 id="how-title">How it works</h2>
            <p className="muted">From sign-up to a published invitation in one sitting.</p>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p className="muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section" aria-labelledby="features-title">
          <div className="section-head">
            <h2 id="features-title">Everything in one place</h2>
            <p className="muted">No more spreadsheets, scattered WhatsApp replies or guessing who’s coming.</p>
          </div>
          <ul className="features">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <h3>{f.title}</h3>
                <p className="muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="cta-band" aria-labelledby="cta-title">
          <div>
            <h2 id="cta-title">Ready when you are</h2>
            <p className="muted">Start tonight, invite your partner, and publish when it feels right.</p>
          </div>
          {primaryCta}
        </section>
      </main>

      <footer className="landing-footer">
        <span className="brand">Alárinà</span>
        <span>© {new Date().getFullYear()} Alárinà</span>
      </footer>
    </div>
  )
}
