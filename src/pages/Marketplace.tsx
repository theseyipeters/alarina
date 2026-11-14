import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import Logo from '../components/Logo.tsx'
import { EmptyState } from '../components/States.tsx'
import { useTitle } from '../lib/useTitle.ts'
import './vendor/vendor.css'

/** The marketplace is being prepared for couples and wedding vendors. */
export default function Marketplace() {
  useTitle('Marketplace')

  return (
    <div className="page page--wide">
      <MarketHeader />
      <main id="main" className="market">
        <div className="market-intro">
          <h1>Marketplace</h1>
        </div>
        <EmptyState card icon="store" title="The marketplace is coming soon">
          We’re preparing a place to find trusted wedding vendors and thoughtful gifts from Nigerian shops. Check back soon.
        </EmptyState>
      </main>
    </div>
  )
}

export function MarketHeader() {
  const { state } = useAuth()
  return (
    <header className="row">
      <Link to="/" className="brand"><Logo /></Link>
      {state.status === 'signedIn' ? (
        <Link to="/app" className="btn btn--secondary">Your wedding</Link>
      ) : state.status === 'vendor' ? (
        <Link to="/vendor" className="btn btn--secondary">Your dashboard</Link>
      ) : (
        <Link to="/signin" className="btn btn--secondary">Sign in</Link>
      )}
    </header>
  )
}
