import { Link } from 'react-router'
import { formatNaira } from '../lib/money.ts'
import { useGiftsAccess } from '../lib/useGiftsAccess.ts'

/** A nudge to unlock Gifts, shown wherever a couple is likely to look until they have. */
export default function UnlockCallout({ where }: { where: 'overview' | 'share' }) {
  const { access } = useGiftsAccess()
  if (!access || access.unlocked || access.closed) return null

  return (
    <section className="card unlock-callout" aria-labelledby={`unlock-callout-${where}`}>
      <h2 id={`unlock-callout-${where}`}>Gifts are locked</h2>
      <p className="muted">
        {where === 'share'
          ? 'Send your invitation now. Gifts appear for guests as soon as you unlock them, and guests who replied earlier can give from their private reply link.'
          : 'Unlock Gifts to let guests send cash, order aso-ebi and give from your wishlist. It’s a one-time payment for your whole wedding.'}
      </p>
      <Link to="/app/gifts" className="btn">Unlock Gifts · {formatNaira(access.price)}</Link>
    </section>
  )
}
