import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { api, imageSrc } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira } from '../lib/money.ts'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import { VENDOR_CATEGORIES, type VendorCategory } from '../lib/vendors.ts'
import { useLoad } from '../planning/useLoad.ts'
import { MarketHeader } from './Marketplace.tsx'
import './vendor/vendor.css'

type PublicVendor = {
  id: string
  slug: string
  businessName: string
  category: VendorCategory
  city: string | null
  coverImageId: string | null
  priceFrom: number | null
  description: string
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  gallery: string[]
  packages: { id: string; name: string; description: string; price: number }[]
  products: { id: string; name: string; description: string; imageId: string | null; price: number }[]
  bookable: boolean
}

/** A vendor's marketplace page. Signed-in couples can add them to their wedding, or invite a planner. */
export default function VendorPage() {
  const { slug = '' } = useParams()
  const [state] = useLoad<{ vendor: PublicVendor }>(`/public/marketplace/vendors/${encodeURIComponent(slug)}`)
  useTitle(state.status === 'ready' ? state.data.vendor.businessName : 'Vendor')

  return (
    <div className="page page--wide">
      <MarketHeader />
      <main id="main" className="market">
        <Link to="/marketplace" className="link-button">← Marketplace</Link>
        {state.status === 'loading' && <p className="muted">Loading…</p>}
        {state.status === 'error' && <p role="alert" className="alert">This vendor isn’t on Alárinà.</p>}
        {state.status === 'ready' && <Profile vendor={state.data.vendor} />}
      </main>
    </div>
  )
}

function Profile({ vendor: v }: { vendor: PublicVendor }) {
  const instagram = v.instagram?.replace(/^@/, '')
  return (
    <article className="vendor-profile">
      {v.coverImageId && <img className="vendor-cover" src={imageSrc(v.coverImageId)} alt="" />}
      <div className="gifts-grid">
        <div className="stack">
          <p className="eyebrow">{VENDOR_CATEGORIES[v.category].one}{v.city && ` · ${v.city}`}</p>
          <h1>{v.businessName}</h1>
          {v.priceFrom !== null && <p className="muted">From {formatNaira(v.priceFrom)}</p>}
          <p className="vendor-description">{v.description}</p>

          {v.packages.length > 0 && (
            <section aria-labelledby="packages-title">
              <h2 id="packages-title">Packages</h2>
              <ul className="item-list">
                {v.packages.map((p) => (
                  <li key={p.id}>
                    <span className="gift-name">
                      {p.name}
                      {p.description && <span className="hint">{p.description}</span>}
                    </span>
                    <strong>{formatNaira(p.price)}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {v.gallery.length > 0 && (
            <ul className="vendor-gallery" aria-label="Gallery">
              {v.gallery.map((id) => (
                <li key={id}>
                  <img className="vendor-gallery-photo" src={imageSrc(id)} alt="" loading="lazy" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="stack">
          <Actions vendor={v} />
          <section className="card" aria-labelledby="contact-title">
            <h2 id="contact-title">Contact</h2>
            <ul className="contact-list">
              {v.phone && <li><a href={`tel:${v.phone}`}>{v.phone}</a></li>}
              {v.email && <li><a href={`mailto:${v.email}`}>{v.email}</a></li>}
              {v.website && <li><a href={v.website} target="_blank" rel="noopener noreferrer">Website</a></li>}
              {instagram && <li><a href={`https://instagram.com/${encodeURIComponent(instagram)}`} target="_blank" rel="noopener noreferrer">@{instagram}</a></li>}
            </ul>
          </section>
        </aside>
      </div>
    </article>
  )
}

/** What a signed-in couple can do here. Anyone else is asked to sign in. */
function Actions({ vendor: v }: { vendor: PublicVendor }) {
  const { state } = useAuth()

  if (state.status === 'vendor') return v.category === 'gifts' ? null : <PlannerActions vendor={v} />
  if (state.status !== 'signedIn') {
    return (
      <section className="card">
        <h2>Planning a wedding?</h2>
        <p className="muted">Sign in to add {v.businessName} to your wedding, send an enquiry and book.</p>
        <Link className="btn" to={`/signin?next=${encodeURIComponent(`/marketplace/${v.slug}`)}`}>Sign in</Link>
      </section>
    )
  }
  return <CoupleActions vendor={v} />
}

function CoupleActions({ vendor: v }: { vendor: PublicVendor }) {
  const [wedding] = useWedding()
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const weddingId = wedding.status === 'ready' ? wedding.wedding?.id : undefined

  async function run(work: () => Promise<unknown>, message: string) {
    setBusy(true)
    setError(null)
    try {
      await work()
      setDone(message)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (wedding.status === 'loading') return null
  if (!weddingId) {
    return (
      <section className="card">
        <p className="muted">Start your wedding setup first, then add vendors to it.</p>
        <Link className="btn" to="/app">Your wedding</Link>
      </section>
    )
  }

  return (
    <section className="card" aria-labelledby="actions-title">
      <h2 id="actions-title">Add to your wedding</h2>
      {error && <p role="alert" className="alert">{error}</p>}
      {done ? (
        <p role="status" className="alert alert--success">
          {done} <Link to="/app/vendors">See your vendors</Link>
        </p>
      ) : (
        <div className="stack">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => run(() => api.post(`/planning/${weddingId}/team`, { vendorId: v.id }), `${v.businessName} is on your team. Send them an enquiry from Vendors.`)}
          >
            Add to my vendors
          </button>
          {v.category === 'planner' && (
            <>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => run(() => api.post(`/planning/${weddingId}/planners`, { vendorId: v.id, role: 'main' }), `We’ve invited ${v.businessName} to be your main planner.`)}
              >
                Invite as main planner
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => run(() => api.post(`/planning/${weddingId}/planners`, { vendorId: v.id, role: 'co' }), `We’ve invited ${v.businessName} to plan with you.`)}
              >
                Invite as co-planner
              </button>
            </>
          )}
          {!v.bookable && <p className="hint">This vendor can’t take payments in the app yet. You can still track what you pay them on your budget.</p>}
        </div>
      )}
    </section>
  )
}

type PlannedWedding = { weddingId: string; names: string; role: 'main' | 'co' }

/** A main planner adds vendors to the weddings they lead. */
function PlannerActions({ vendor: v }: { vendor: PublicVendor }) {
  const [state] = useLoad<{ weddings: PlannedWedding[] }>('/planning')
  const [done, setDone] = useState<Record<string, string>>({})

  if (state.status !== 'ready') return null
  const leading = state.data.weddings.filter((w) => w.role === 'main')
  if (leading.length === 0) return null

  async function add(w: PlannedWedding) {
    try {
      await api.post(`/planning/${w.weddingId}/team`, { vendorId: v.id })
      setDone({ ...done, [w.weddingId]: `Added to ${w.names}` })
    } catch (err) {
      setDone({ ...done, [w.weddingId]: errorMessage(err) })
    }
  }

  return (
    <section className="card" aria-labelledby="planner-actions-title">
      <h2 id="planner-actions-title">Add to a wedding you’re planning</h2>
      <ul className="item-list">
        {leading.map((w) => (
          <li key={w.weddingId}>
            <span className="gift-name">{w.names}</span>
            {done[w.weddingId] ? (
              <span role="status" className="hint">{done[w.weddingId]}</span>
            ) : (
              <button type="button" className="btn btn--secondary" onClick={() => add(w)}>Add</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
