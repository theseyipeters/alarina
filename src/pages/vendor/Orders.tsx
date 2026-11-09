import { useState } from 'react'
import { api } from '../../lib/api.ts'
import { errorMessage } from '../../lib/errors.ts'
import { formatDate } from '../../lib/format.ts'
import { formatNaira } from '../../lib/money.ts'
import { useTitle } from '../../lib/useTitle.ts'
import { useLoad } from '../../planning/useLoad.ts'
import '../Gifts.css'

type Order = {
  id: string
  paymentId: string
  index: number
  itemName: string
  amount: number
  price: number
  guestName: string
  paidAt: string | null
  deliveredAt: string | null
  couple: { names: string; date: string | null; venueName: string | null; phones: string[]; emails: string[] } | null
}

/** A gift vendor's orders: what guests bought, for which couple, and whether it's been delivered. */
export default function Orders() {
  useTitle('Orders')
  const [state, reload] = useLoad<{ orders: Order[]; totals: { received: number; count: number } }>('/vendor/orders')
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'loading') return <p className="muted">Loading orders…</p>
  if (state.status === 'error') return <p role="alert" className="alert">{state.message}</p>
  const { orders, totals } = state.data

  async function delivered(o: Order) {
    setError(null)
    try {
      await api.post(`/vendor/orders/${o.paymentId}/lines/${o.index}/delivered`)
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="gifts">
      <section className="gifts-hero">
        <div>
          <p className="eyebrow">Gift orders</p>
          <p className="gifts-total">{formatNaira(totals.received)}</p>
          <p className="muted">{totals.count === 1 ? '1 order' : `${totals.count} orders`} from guests</p>
        </div>
      </section>
      {error && <p role="alert" className="alert">{error}</p>}
      <section className="card" aria-labelledby="orders-title">
        <h2 id="orders-title">Orders</h2>
        {orders.length === 0 ? (
          <p className="board-empty">No orders yet. When a couple adds your products to their wishlist, guests can buy them.</p>
        ) : (
          <ul className="item-list">
            {orders.map((o) => (
              <li key={o.id}>
                <span className="gift-name">
                  {o.itemName}
                  <span className="hint">
                    {formatNaira(o.amount)}
                    {o.amount < o.price && ` towards ${formatNaira(o.price)}`} from {o.guestName}
                    {o.paidAt && ` · ${new Date(o.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                  </span>
                  {o.couple && (
                    <span className="hint">
                      For {o.couple.names}
                      {o.couple.date && `, ${formatDate(o.couple.date)}`}
                      {o.couple.venueName && ` at ${o.couple.venueName}`}
                      {[...o.couple.phones, ...o.couple.emails].length > 0 && ` · ${[...o.couple.phones, ...o.couple.emails].join(' · ')}`}
                    </span>
                  )}
                </span>
                {o.deliveredAt ? (
                  <span className="badge badge--live">Delivered</span>
                ) : (
                  <button type="button" className="btn btn--secondary" onClick={() => delivered(o)}>
                    Mark delivered
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
