import './HeroVendor.css'

const PACKAGES = [
  { name: 'Full planning', price: '₦1,200,000' },
  { name: 'On-the-day coordination', price: '₦450,000' },
]

const UPDATES = ['New enquiry · 11 December 2027', 'Quote accepted', 'Deposit paid · ₦150,000']

/**
 * The vendor side of the account pages: a marketplace listing, with an enquiry, an accepted
 * quote and a deposit arriving. The business is made up. Pure CSS motion, played once; with
 * reduced motion it shows the finished scene.
 */
export default function HeroVendor() {
  return (
    <div className="vendor-art" role="img" aria-label="A planner’s listing on Alárinà, as an enquiry, an accepted quote and a deposit arrive.">
      <div className="vendor-listing" aria-hidden="true">
        <div className="vendor-cover">
          <span className="vendor-cover-arch" />
          <span className="vendor-cover-arch vendor-cover-arch--inner" />
        </div>
        <div className="vendor-body">
          <p className="vendor-eyebrow">Planner · Lagos</p>
          <p className="vendor-name">Ìfẹ́ Events</p>
          <ul className="vendor-packages">
            {PACKAGES.map((p) => (
              <li key={p.name}>
                <span>{p.name}</span>
                <span>{p.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="vendor-updates" aria-hidden="true">
        {UPDATES.map((text) => (
          <li key={text} className="vendor-update">
            <svg className="vendor-update-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
