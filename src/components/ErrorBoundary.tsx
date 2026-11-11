import { Component, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { StateArt } from './States.tsx'

type Props = { children: ReactNode; resetKey: string }
type State = { error: Error | null }

// After a release the old page asks for files that are no longer there.
const isStaleBuild = (error: Error) =>
  /dynamically imported module|importing a module script failed|error loading dynamically/i.test(error.message)

class Boundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    // Moving to another page clears it, so one broken page doesn't take the rest with it.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const stale = isStaleBuild(error)
    return (
      <main id="main" className="page">
        <div className={stale ? 'card state' : 'card state state--error'} role="alert">
          <StateArt icon={stale ? 'refresh' : 'alert'} tone={stale ? 'empty' : 'error'} />
          <h1 className="state-title">{stale ? 'Alárinà has been updated' : 'This page hit a problem'}</h1>
          <p className="state-body">
            {stale
              ? 'Reload the page to carry on where you were.'
              : 'Nothing you saved has been lost. Reload the page, and if it happens again, go back to the start.'}
          </p>
          <div className="state-actions">
            <button type="button" className="btn" onClick={() => window.location.reload()}>Reload the page</button>
            {!stale && <a href="/">Go to the start</a>}
          </div>
        </div>
      </main>
    )
  }
}

/**
 * Catches a page that fails to draw, or whose code fails to download, so the visitor gets a way
 * forward instead of a blank screen.
 */
export default function ErrorBoundary({ children }: { children: ReactNode }) {
  return <Boundary resetKey={useLocation().pathname}>{children}</Boundary>
}
