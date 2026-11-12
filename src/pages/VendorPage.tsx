import { useEffect, useRef, useState } from 'react'
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
import './VendorPage.css'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'

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
  const [state, reload] = useLoad<{ vendor: PublicVendor }>(`/public/marketplace/vendors/${encodeURIComponent(slug)}`)
  useTitle(state.status === 'ready' ? state.data.vendor.businessName : 'Vendor')

  return (
    <div className="page page--wide page--vendor">
      <MarketHeader />
      <main id="main" className="market">
        <Link to="/marketplace" className="link-button">← Marketplace</Link>
        {state.status === 'loading' && <Loading />}
        {state.status === 'error' &&
          (state.notFound ? (
            <EmptyState card icon="store" title="This vendor isn’t on Alárinà" action={<Link to="/marketplace" className="btn">Browse the marketplace</Link>}>
              The link may be wrong, or their listing is no longer public.
            </EmptyState>
          ) : (
            <LoadError title="This vendor didn’t load" message={state.message} onRetry={reload} />
          ))}
        {state.status === 'ready' && <Profile vendor={state.data.vendor} />}
      </main>
    </div>
  )
}

/** Couples see the long descriptions folded after this many characters, with "Read more". */
const FOLD_AT = 600

function Profile({ vendor: v }: { vendor: PublicVendor }) {
  const instagram = v.instagram?.replace(/^@/, '')
  const photos = [...new Set([v.coverImageId, ...v.gallery].filter((id): id is string => Boolean(id)))]
  const [viewing, setViewing] = useState<number | null>(null)
  const [unfolded, setUnfolded] = useState(false)
  const long = v.description.length > FOLD_AT
  const category = VENDOR_CATEGORIES[v.category]
  const gifts = v.category === 'gifts'
  const products = v.products

  return (
    <article className="vp">
      <header className="vp-head">
        <p className="vp-tags">
          <Link className="vp-tag" to={`/marketplace?category=${v.category}`}>{category.one}</Link>
          {v.city && (
            <span className="vp-place">
              <Icon name="pin" />
              {v.city}
            </span>
          )}
        </p>
        <h1>{v.businessName}</h1>
        {v.priceFrom !== null && (
          <p className="vp-from">
            From <span className="vp-from-amount">{formatNaira(v.priceFrom)}</span>
          </p>
        )}
      </header>

      {photos.length > 0 && (
        <div className={`vp-photos vp-photos--${Math.min(photos.length, 5)}`}>
          {photos.slice(0, 5).map((id, i) => (
            <button key={id} type="button" className="vp-photo" onClick={() => setViewing(i)} aria-label={`View photo ${i + 1} of ${photos.length}`}>
              <img src={imageSrc(id)} alt="" loading={i ? 'lazy' : undefined} />
            </button>
          ))}
          {photos.length > 1 && (
            <button type="button" className="btn btn--secondary btn--sm vp-photos-all" onClick={() => setViewing(0)}>
              See all {photos.length} photos
            </button>
          )}
        </div>
      )}

      <div className="vp-body">
        <div className="vp-main">
          <section aria-labelledby="about-title">
            <h2 id="about-title">About</h2>
            <p className={long && !unfolded ? 'vp-about vp-about--folded' : 'vp-about'}>{v.description}</p>
            {long && (
              <button type="button" className="link-button" aria-expanded={unfolded} onClick={() => setUnfolded(!unfolded)}>
                {unfolded ? 'Show less' : 'Read more'}
              </button>
            )}
          </section>

          {v.packages.length > 0 && (
            <section aria-labelledby="packages-title">
              <h2 id="packages-title">Packages</h2>
              <ul className="vp-packages">
                {v.packages.map((p) => (
                  <li key={p.id} className="vp-package">
                    <p className="vp-package-name">{p.name}</p>
                    <p className="vp-package-price">{formatNaira(p.price)}</p>
                    {p.description && <p className="vp-package-about">{p.description}</p>}
                  </li>
                ))}
              </ul>
              <p className="hint">Prices are a guide. {v.businessName} confirms the final amount in a quote.</p>
            </section>
          )}

          {gifts && products.length > 0 && (
            <section aria-labelledby="products-title">
              <h2 id="products-title">In the shop</h2>
              <ul className="vp-products">
                {products.map((p) => (
                  <li key={p.id} className="vp-product">
                    {p.imageId ? <img src={imageSrc(p.imageId)} alt="" loading="lazy" /> : <span className="vp-product-empty" aria-hidden="true" />}
                    <p className="vp-product-name">{p.name}</p>
                    <p className="vp-product-price">{formatNaira(p.price)}</p>
                    {p.description && <p className="hint">{p.description}</p>}
                  </li>
                ))}
              </ul>
              <p className="hint">Couples add these to their wishlist, and guests buy them as gifts.</p>
            </section>
          )}
        </div>

        <aside className="vp-aside">
          <Actions vendor={v} />
          {(v.phone || v.email || v.website || instagram) && (
            <section className="card vp-contact" aria-labelledby="contact-title">
              <h2 id="contact-title">Contact</h2>
              <ul>
                {v.phone && (
                  <li>
                    <Icon name="phone" />
                    <a href={`tel:${v.phone.replace(/\s/g, '')}`}>{v.phone}</a>
                  </li>
                )}
                {v.email && (
                  <li>
                    <Icon name="mail" />
                    <a href={`mailto:${v.email}`}>{v.email}</a>
                  </li>
                )}
                {v.website && (
                  <li>
                    <Icon name="globe" />
                    <a href={v.website} target="_blank" rel="noopener noreferrer">
                      {hostOf(v.website)}
                    </a>
                  </li>
                )}
                {instagram && (
                  <li>
                    <Icon name="instagram" />
                    <a href={`https://instagram.com/${encodeURIComponent(instagram)}`} target="_blank" rel="noopener noreferrer">
                      @{instagram}
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {viewing !== null && <PhotoViewer photos={photos} start={viewing} name={v.businessName} onClose={() => setViewing(null)} />}
    </article>
  )
}

/** "www.example.com/about" → "example.com". Falls back to the link as typed. */
function hostOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

const ICONS = {
  pin: <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  phone: <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7.5 8 6 8-6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="M16.75 7.25h.01" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  prev: <path d="m14.5 6-6 6 6 6" />,
  next: <path d="m9.5 6 6 6-6 6" />,
} as const

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="vp-icon" viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

/** Every photo, one at a time, over the page. Arrow keys move between them; Escape closes it. */
function PhotoViewer({ photos, start, name, onClose }: { photos: string[]; start: number; name: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [i, setI] = useState(start)
  const go = (step: number) => setI((n) => (n + step + photos.length) % photos.length)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement
    dialog.showModal()
    return () => {
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className="vp-viewer"
      aria-label={`Photos of ${name}`}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
    >
      <img src={imageSrc(photos[i] ?? '')} alt={`Photo ${i + 1} of ${photos.length}`} />
      <p className="vp-viewer-count" aria-live="polite">
        {i + 1} of {photos.length}
      </p>
      <button type="button" className="vp-viewer-btn vp-viewer-close" aria-label="Close" onClick={() => ref.current?.close()}>
        <Icon name="close" />
      </button>
      {photos.length > 1 && (
        <>
          <button type="button" className="vp-viewer-btn vp-viewer-prev" aria-label="Previous photo" onClick={() => go(-1)}>
            <Icon name="prev" />
          </button>
          <button type="button" className="vp-viewer-btn vp-viewer-next" aria-label="Next photo" onClick={() => go(1)}>
            <Icon name="next" />
          </button>
        </>
      )}
    </dialog>
  )
}

/** What a signed-in couple can do here. Anyone else is asked to sign in. */
function Actions({ vendor: v }: { vendor: PublicVendor }) {
  const { state } = useAuth()

  if (state.status === 'vendor') return v.category === 'gifts' ? null : <PlannerActions vendor={v} />
  if (state.status !== 'signedIn') {
    return (
      <section className="card vp-actions">
        <h2>Planning a wedding?</h2>
        <p className="muted">Sign in to add {v.businessName} to your wedding, ask for a quote and book.</p>
        <Link className="btn" to={`/signin?next=${encodeURIComponent(`/marketplace/${v.slug}`)}`}>Sign in</Link>
        <p className="hint">
          New here? <Link to={`/signup?next=${encodeURIComponent(`/marketplace/${v.slug}`)}`}>Create an account</Link>
        </p>
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
      <section className="card vp-actions">
        <h2>Add to your wedding</h2>
        <p className="muted">Set up your wedding first, then add {v.businessName} to it.</p>
        <Link className="btn" to="/app/setup">Set up your wedding</Link>
      </section>
    )
  }

  return (
    <section className="card vp-actions" aria-labelledby="actions-title">
      <h2 id="actions-title">Add to your wedding</h2>
      {error && <p role="alert" className="alert">{error}</p>}
      {done ? (
        <p role="status" className="alert alert--success">
          {done} <Link to="/app/vendors">See your vendors</Link>
        </p>
      ) : (
        <>
          <p className="muted">Add them to your vendors to ask for a quote, book and pay, all in one place.</p>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => run(() => api.post(`/planning/${weddingId}/team`, { vendorId: v.id }), `${v.businessName} is on your team. Send them an enquiry from Vendors.`)}
          >
            Add to my vendors
          </button>
          {v.category === 'planner' && (
            <div className="vp-actions-more" role="group" aria-labelledby="invite-title">
              <p id="invite-title" className="vp-actions-label">Or invite them to plan with you</p>
              <div className="vp-actions-pair">
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={busy}
                  onClick={() => run(() => api.post(`/planning/${weddingId}/planners`, { vendorId: v.id, role: 'main' }), `We’ve invited ${v.businessName} to be your main planner.`)}
                >
                  Main planner
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={busy}
                  onClick={() => run(() => api.post(`/planning/${weddingId}/planners`, { vendorId: v.id, role: 'co' }), `We’ve invited ${v.businessName} to plan with you.`)}
                >
                  Co-planner
                </button>
              </div>
              <p className="hint">A main planner leads the planning with you and can add vendors. A co-planner helps alongside.</p>
            </div>
          )}
          {!v.bookable && <p className="hint">They can’t take payments in the app yet. You can still track what you pay them on your budget.</p>}
        </>
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
    <section className="card vp-actions" aria-labelledby="planner-actions-title">
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
