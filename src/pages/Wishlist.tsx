import { useTitle } from '../lib/useTitle.ts'

/** Wishlist: the couple lists items with prices and guests pay for all or part of them. */
export default function Wishlist() {
  useTitle('Wishlist')

  return (
    <section className="card" aria-labelledby="wishlist-title">
      <h2 id="wishlist-title">Wishlist</h2>
      <p className="muted">
        List the things you’d love to receive, each with a price. Guests can pay for an item in full or chip in towards
        it. This is coming next.
      </p>
    </section>
  )
}
