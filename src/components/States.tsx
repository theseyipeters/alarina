import { useEffect, useEffectEvent, useState, type ReactNode } from 'react'

// Line icons for empty and failed states. 24px grid, drawn in currentColor, always decorative.
const ICONS = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 20 20" />
    </>
  ),
  store: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5v10h16v-10M4 9.5h16M9.5 19.5v-5h5v5" />,
  envelope: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7.5 8 6 8-6" />
    </>
  ),
  gift: (
    <>
      <rect x="4.5" y="11" width="15" height="9" rx="1.5" />
      <path d="M3.5 7.5h17V11h-17zM12 7.5V20M12 7.5c-1.2-3.6-5.4-3.4-5 0M12 7.5c1.2-3.6 5.4-3.4 5 0" />
    </>
  ),
  box: <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16zM3.5 8l8.5 4.5L20.5 8M12 12.5v8" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="2" />
      <path d="M3.5 10.5h17M15.5 15h1.5" />
    </>
  ),
  list: <path d="M8.5 7h11M8.5 12h11M8.5 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V13M12 16.2v.01" />
    </>
  ),
  refresh: <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />,
  offline: <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14 10.3A10 10 0 0 1 19 13M2 9.5a14.5 14.5 0 0 1 5-3M11 5a14.5 14.5 0 0 1 11 4.5M12 20h.01" />,
} as const

export type StateIcon = keyof typeof ICONS

const Icon = ({ name }: { name: StateIcon }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[name]}
  </svg>
)

/**
 * A little stack of cards: the front one carries the icon and two faint lines, a hint of what will
 * fill this space. Two cards fan out behind it. Errors draw the cards behind as dashed outlines.
 */
export function StateArt({ icon, tone }: { icon: StateIcon; tone: 'empty' | 'error' }) {
  return (
    <span className={`state-art state-art--${tone}`} aria-hidden="true">
      <span className="state-art-card state-art-card--back" />
      <span className="state-art-card state-art-card--mid" />
      <span className="state-art-card state-art-card--front">
        <span className="state-art-icon">
          <Icon name={icon} />
        </span>
        <span className="state-art-lines">
          <span />
          <span />
        </span>
      </span>
    </span>
  )
}

type EmptyProps = {
  icon: StateIcon
  title: string
  /** What it means and what to do next, in a sentence or two. */
  children?: ReactNode
  /** One next step: a button or link. A second, quieter one is fine. */
  action?: ReactNode
  /** Draw its own card, for when it stands alone rather than inside one. */
  card?: boolean
  /** A single row with a small icon, for a list inside a panel that has other things in it. */
  compact?: boolean
}

/** Nothing here yet: says so plainly, hints at what will appear, and offers the next step. */
export function EmptyState({ icon, title, children, action, card, compact }: EmptyProps) {
  if (compact) {
    return (
      <div className={card ? 'card state state--compact' : 'state state--compact'}>
        <span className="state-chip" aria-hidden="true">
          <Icon name={icon} />
        </span>
        <div className="state-text">
          <p className="state-title">{title}</p>
          {children && <p className="state-body">{children}</p>}
        </div>
        {action && <div className="state-actions">{action}</div>}
      </div>
    )
  }
  return (
    <div className={card ? 'card state' : 'state'}>
      <StateArt icon={icon} tone="empty" />
      <p className="state-title">{title}</p>
      {children && <p className="state-body">{children}</p>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  )
}

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

type LoadErrorProps = {
  /** What didn't load, as a sentence: "Your budget didn’t load". */
  title?: string
  /** Why, and what to do: from errorMessage(). */
  message: string
  /** Loads it again. Left out when trying again can't help. */
  onRetry?: () => unknown
  children?: ReactNode
  /** A single row, for a part of a page that failed while the rest loaded. */
  compact?: boolean
}

/**
 * Something failed to load: what, why, and a way to try again without refreshing the page.
 * Offline, it says so and tries again by itself once the connection is back. If trying again
 * keeps failing, it stops suggesting the connection and says the fault is likely ours.
 */
export function LoadError({ title = 'This didn’t load', message, onRetry, children, compact }: LoadErrorProps) {
  const [busy, setBusy] = useState(false)
  const [tries, setTries] = useState(0)
  const [offline, setOffline] = useState(isOffline)

  async function retry() {
    setBusy(true)
    try {
      await onRetry?.()
    } finally {
      // Still here, so it failed again (on success the page replaces this).
      setBusy(false)
      setTries((n) => n + 1)
    }
  }

  // Back online: try again by itself, with the latest retry.
  const onBackOnline = useEffectEvent(() => {
    setOffline(false)
    if (onRetry) void retry()
  })

  useEffect(() => {
    const goneOffline = () => setOffline(true)
    const backOnline = () => onBackOnline()
    window.addEventListener('offline', goneOffline)
    window.addEventListener('online', backOnline)
    return () => {
      window.removeEventListener('offline', goneOffline)
      window.removeEventListener('online', backOnline)
    }
  }, [])

  const heading = offline ? 'You’re offline' : title
  const why = offline
    ? 'This will load once you’re back online. Nothing you saved has been lost.'
    : tries >= 2
      ? 'It still isn’t loading, so the problem is likely on our side. Give it a few minutes, then try again.'
      : message

  const button = onRetry && (
    <button type="button" className={compact ? 'link-button' : 'btn btn--secondary'} onClick={retry} disabled={busy}>
      {busy ? 'Trying again…' : offline ? 'Try now' : 'Try again'}
    </button>
  )

  if (compact) {
    return (
      <div className="state state--compact state--error" role="alert">
        <span className="state-chip" aria-hidden="true">
          <Icon name={offline ? 'offline' : 'alert'} />
        </span>
        <div className="state-text">
          <p className="state-title">{heading}</p>
          <p className="state-body">{why}</p>
        </div>
        {(button || children) && (
          <div className="state-actions">
            {button}
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card state state--error" role="alert">
      <StateArt icon={offline ? 'offline' : 'alert'} tone="error" />
      <p className="state-title">{heading}</p>
      <p className="state-body">{why}</p>
      {(button || children) && (
        <div className="state-actions">
          {button}
          {children}
        </div>
      )}
    </div>
  )
}

type LoadingProps = {
  /** Read out to screen readers: "Loading your budget". */
  label?: string
  /** How many placeholder rows to draw. */
  rows?: number
  /** Wrap in the page column, for a whole page that is loading. */
  page?: boolean
}

/**
 * A quiet placeholder in the shape of a list. It waits a moment before appearing, so fast loads
 * don't flash, then shimmers (or holds still with reduced motion).
 */
export function Loading({ label = 'Loading', rows = 3, page }: LoadingProps) {
  const skeleton = (
    <div className="loading" role="status">
      <span className="visually-hidden">{label}</span>
      <span className="loading-line loading-line--title" aria-hidden="true" />
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="loading-row" aria-hidden="true">
          <span className="loading-dot" />
          <span className="loading-lines">
            <span className="loading-line" />
            <span className="loading-line loading-line--short" />
          </span>
        </span>
      ))}
    </div>
  )
  return page ? <main id="main" className="page">{skeleton}</main> : skeleton
}
