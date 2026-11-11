import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import Logo from '../components/Logo.tsx'
import { api, imageSrc } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira } from '../lib/money.ts'
import { useTitle } from '../lib/useTitle.ts'
import { CATEGORY_IDS, VENDOR_CATEGORIES, type VendorCategory } from '../lib/vendors.ts'
import { useLoad } from '../planning/useLoad.ts'
import './vendor/vendor.css'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'

type Card = {
  slug: string
  businessName: string
  category: VendorCategory
  city: string | null
  coverImageId: string | null
  priceFrom: number | null
  summary: string
}

type Product = {
  id: string
  vendorId: string
  vendorSlug: string
  vendorName: string
  name: string
  description: string
  imageId: string | null
  price: number
}

/** The marketplace: vendors by category, and the gift shop. Open to everyone; couples act on what they find. */
export default function Marketplace() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'gifts' ? 'gifts' : 'vendors'
  useTitle(tab === 'gifts' ? 'Gift shop' : 'Marketplace')

  return (
    <div className="page page--wide">
      <MarketHeader />
      <main id="main" className="market">
        <div className="market-intro">
          <h1>{tab === 'gifts' ? 'Gift shop' : 'Find your wedding vendors'}</h1>
          <p className="muted">
            {tab === 'gifts'
              ? 'Gifts from Nigerian shops. Add them to your wishlist: guests buy them, and the shop delivers to you.'
              : 'Planners, venues, caterers, photographers and more, each checked by our team. Enquire, book and pay in one place.'}
          </p>
        </div>
        <nav className="tabs" aria-label="Marketplace">
          <button type="button" className="tab" aria-current={tab === 'vendors' ? 'page' : undefined} onClick={() => setParams({})}>Vendors</button>
          <button type="button" className="tab" aria-current={tab === 'gifts' ? 'page' : undefined} onClick={() => setParams({ tab: 'gifts' })}>Gift shop</button>
        </nav>
        {tab === 'gifts' ? <GiftShop /> : <Vendors />}
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

function Vendors() {
  const [params, setParams] = useSearchParams()
  const category = (params.get('category') ?? '') as VendorCategory | ''
  const q = params.get('q') ?? ''
  const city = params.get('city') ?? ''
  const query = new URLSearchParams({ ...(category && { category }), ...(q && { q }), ...(city && { city }) }).toString()
  const [state, reload] = useLoad<{ vendors: Card[]; total: number }>(`/public/marketplace/vendors${query ? `?${query}` : ''}`)

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const next = new URLSearchParams(params)
    for (const key of ['q', 'city']) {
      const value = String(form.get(key) ?? '').trim()
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }

  const pick = (id: VendorCategory | '') => {
    const next = new URLSearchParams(params)
    if (id) next.set('category', id)
    else next.delete('category')
    setParams(next)
  }

  return (
    <>
      <form className="market-search" onSubmit={search} role="search">
        <input name="q" type="search" aria-label="Search vendors" placeholder="Search by name or service" defaultValue={q} />
        <input name="city" type="search" aria-label="City" placeholder="City" defaultValue={city} />
        <button className="btn">Search</button>
      </form>
      <div className="chips" role="group" aria-label="Categories">
        <button type="button" className="chip" aria-pressed={!category} onClick={() => pick('')}>All</button>
        {CATEGORY_IDS.filter((id) => id !== 'gifts').map((id) => (
          <button key={id} type="button" className="chip" aria-pressed={category === id} onClick={() => pick(id)}>
            {VENDOR_CATEGORIES[id].label}
          </button>
        ))}
      </div>
      {state.status === 'loading' && <Loading label="Loading vendors" />}
      {state.status === 'error' && <LoadError title="The vendors didn’t load" message={state.message} onRetry={reload} />}
      {state.status === 'ready' &&
        (state.data.vendors.length === 0 ? (
          query ? (
            <EmptyState
              card
              icon="search"
              title="No vendors match"
              action={<button type="button" className="btn btn--secondary" onClick={() => setParams({})}>Clear search</button>}
            >
              Nothing fits that search yet. Try another category or city, or a shorter name.
            </EmptyState>
          ) : (
            <EmptyState card icon="store" title="No vendors here yet" action={<Link to="/signup?as=vendor">List your business</Link>}>
              Listings appear here once our team has checked them. If you work on weddings, yours could be the first.
            </EmptyState>
          )
        ) : (
          <ul className="market-grid">
            {state.data.vendors.map((v) => (
              <li key={v.slug} className="market-card">
                <Link to={`/marketplace/${v.slug}`}>
                  {v.coverImageId ? <img src={imageSrc(v.coverImageId)} alt="" loading="lazy" /> : <span className="market-card-empty" aria-hidden="true" />}
                  <span className="market-card-body">
                    <span className="eyebrow">{VENDOR_CATEGORIES[v.category].one}{v.city && ` · ${v.city}`}</span>
                    <strong>{v.businessName}</strong>
                    {v.priceFrom !== null && <span className="hint">From {formatNaira(v.priceFrom)}</span>}
                    <span className="hint">{v.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </>
  )
}

function GiftShop() {
  const { state: auth } = useAuth()
  const [state, reload] = useLoad<{ products: Product[] }>('/public/marketplace/gifts')
  const [added, setAdded] = useState<Record<string, string>>({})

  async function add(p: Product) {
    try {
      await api.post('/wedding/gifts/wishlist/products', { vendorId: p.vendorId, productId: p.id })
      setAdded({ ...added, [p.id]: 'Added to your wishlist' })
    } catch (err) {
      setAdded({ ...added, [p.id]: errorMessage(err) })
    }
  }

  if (state.status === 'loading') return <Loading label="Loading gifts" />
  if (state.status === 'error') return <LoadError title="The gift shop didn’t load" message={state.message} onRetry={reload} />
  if (state.data.products.length === 0) {
    return (
      <EmptyState card icon="gift" title="No gifts in the shop yet" action={<Link to="/signup?as=vendor">List your products</Link>}>
        Gifts appear here as shops join. If you run one, couples can add your products to their wishlists.
      </EmptyState>
    )
  }

  return (
    <ul className="market-grid">
      {state.data.products.map((p) => (
        <li key={p.id} className="market-card">
          {p.imageId ? <img src={imageSrc(p.imageId)} alt="" loading="lazy" /> : <span className="market-card-empty" aria-hidden="true" />}
          <span className="market-card-body">
            <span className="eyebrow">
              <Link to={`/marketplace/${p.vendorSlug}`}>{p.vendorName}</Link>
            </span>
            <strong>{p.name}</strong>
            <span>{formatNaira(p.price)}</span>
            {p.description && <span className="hint">{p.description}</span>}
            {auth.status === 'signedIn' ? (
              added[p.id] ? (
                <span role="status" className="hint">{added[p.id]}</span>
              ) : (
                <button type="button" className="btn btn--secondary" onClick={() => add(p)}>Add to wishlist</button>
              )
            ) : (
              auth.status === 'signedOut' && <Link to="/signin?next=%2Fmarketplace%3Ftab%3Dgifts" className="hint">Sign in to add it to your wishlist</Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
