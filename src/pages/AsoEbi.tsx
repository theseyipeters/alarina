import { useTitle } from '../lib/useTitle.ts'

/** Aso-ebi: the couple sets the price of the wedding material and guests buy it through the invitation. */
export default function AsoEbi() {
  useTitle('Aso-ebi')

  return (
    <section className="card" aria-labelledby="aso-ebi-title">
      <h2 id="aso-ebi-title">Aso-ebi</h2>
      <p className="muted">
        Offer the material for your wedding at a price you set. Guests choose how much they need and pay through your
        invitation. This is coming next.
      </p>
    </section>
  )
}
