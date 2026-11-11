import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import HeroDemo from '../components/HeroDemo.tsx'
import ClosingBand from '../components/ClosingBand.tsx'
import FeaturesBento from '../components/FeaturesBento.tsx'
import HeroStage from '../components/HeroStage.tsx'
import HowItWorks from '../components/HowItWorks.tsx'
import { useDemo } from '../lib/heroDemo.ts'
import SeeItStory from '../components/SeeItStory.tsx'
import { useTitle } from '../lib/useTitle.ts'
import './Home.css'
import Logo from '../components/Logo.tsx'

export default function Home() {
  useTitle('Wedding invitations and RSVPs')
  const { state } = useAuth()
  const signedIn = state.status === 'signedIn'
  const demo = useDemo()

  const primaryCta = signedIn ? (
    <Link to="/app" className="btn">Go to your wedding</Link>
  ) : (
    <Link to="/signup" className="btn">Create your invitation</Link>
  )

  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" className="brand"><Logo /></Link>
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
            <h1 id="hero-title">
              <span className="hero-mark">
                <span className="hw">One</span> <span className="hw">link</span>
                <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 14 C 70 4, 150 4, 296 10" />
                </svg>
              </span>{' '}
              <span className="hw">for</span> <span className="hw">your</span> <span className="hw">invitation,</span>{' '}
              <span className="hw">RSVPs</span> <span className="hw">and</span> <span className="hw">gifts</span>
            </h1>
            <p className="hero-lead">
              Design your wedding invitation together, share it anywhere, and see who’s coming. Guests reply from their
              phone in under a minute, with no account.
            </p>
            <HeroDemo demo={demo} />
            <div className="actions">
              {primaryCta}
              <a href="#how" className="btn btn--secondary">See how it works</a>
            </div>
            <p className="hero-note">Your invitation stays private until you choose to publish it.</p>
          </div>

          <HeroStage demo={demo} />
        </section>

        <HowItWorks values={demo.values} />

        <SeeItStory values={demo.values} />

        <FeaturesBento values={demo.values} />

        <ClosingBand values={demo.values} cta={primaryCta} />
      </main>

      <footer className="landing-footer">
        <span className="brand"><Logo /></span>
        <span>© {new Date().getFullYear()} Alárinà · <Link to="/cookies">Cookie Policy</Link></span>
      </footer>
    </div>
  )
}
