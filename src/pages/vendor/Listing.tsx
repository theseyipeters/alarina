import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth.ts'
import AmountInput from '../../components/AmountInput.tsx'
import { Petals } from '../../components/Celebration.tsx'
import CopyLink from '../../components/CopyLink.tsx'
import Field from '../../components/Field.tsx'
import Select from '../../components/Select.tsx'
import Tour, { type TourStep } from '../../components/Tour.tsx'
import ImageField from '../../components/ImageField.tsx'
import { api, ApiError, imageSrc } from '../../lib/api.ts'
import { errorMessage } from '../../lib/errors.ts'
import { formatNaira, nairaInput } from '../../lib/money.ts'
import type { Session, VendorListing, VendorPackage, VendorProduct } from '../../lib/types.ts'
import { useTitle } from '../../lib/useTitle.ts'
import { useVendor } from '../../lib/useVendor.ts'
import { CATEGORY_IDS, MAX_PRICE_NAIRA, MIN_PRICE_NAIRA, VENDOR_CATEGORIES, type VendorCategory } from '../../lib/vendors.ts'
import '../Gifts.css'
import { LoadError, Loading } from '../../components/States.tsx'

const UPLOAD = '/vendor/images'

/** A vendor's listing: what couples see in the marketplace, and sending it for review. */
export default function Listing() {
  useTitle('Your listing')
  const [state, setVendor, retry] = useVendor()
  const { state: auth, refresh } = useAuth()
  // null: decide automatically; false once closed.
  const [tour, setTour] = useState<boolean | null>(null)

  if (state.status === 'loading') return <Loading label="Loading your listing" />
  if (state.status === 'error') return <LoadError title="Your listing didn’t load" message={state.message} onRetry={retry} />
  const v = state.vendor
  const upToDate = auth.status === 'vendor' && auth.user.tourVersion >= auth.user.currentTourVersion
  // Once the listing is on screen, so the tour can point at it.
  const tourOpen = tour ?? (auth.status === 'vendor' && !upToDate)

  function endTour() {
    setTour(false)
    if (upToDate) return
    // Best effort: if this fails, the tour simply offers itself again next visit.
    api.post<Session>('/auth/tour').then(refresh, () => {})
  }

  return (
    <div className="gifts">
      {tourOpen && <Tour steps={vendorTour(v)} onClose={endTour} />}
      <ReviewBanner vendor={v} onChange={setVendor} />
      <div className="gifts-grid">
        <Profile vendor={v} onChange={setVendor} />
        <div className="stack">
          <Photos vendor={v} onChange={setVendor} />
          {v.category === 'gifts' ? <Products vendor={v} onChange={setVendor} /> : <Packages vendor={v} onChange={setVendor} />}
        </div>
      </div>
    </div>
  )
}

type Props = { vendor: VendorListing; onChange: (v: VendorListing) => void }

const vendorTour = (v: VendorListing): TourStep[] => [
  {
    title: `Welcome to Alárinà, ${v.businessName}`,
    text: 'A quick look around, so couples can find you, book you and pay you here.',
  },
  {
    target: '[data-tour="vendor-profile"]',
    title: 'Tell couples about you',
    text: 'What you do, where you’re based and how to reach you. A cover photo and a gallery help couples choose.',
  },
  {
    target: '[data-tour="vendor-packages"]',
    title: v.category === 'gifts' ? 'Stock your gift shop' : 'Add your packages',
    text:
      v.category === 'gifts'
        ? 'Couples add your products to their wishlists, guests buy them, and you deliver to the couple.'
        : 'Prices couples can see up front. When they enquire, you can tailor a quote.',
  },
  {
    target: '[data-tour="vendor-review"]',
    title: 'Send it for review',
    text: 'Our team checks every listing before it goes into the marketplace, usually within two working days.',
  },
  {
    target: '[data-tour="vendor-tab-enquiries"]',
    title: 'Enquiries and quotes',
    text: 'Couples write to you here. Send a quote; once they accept, they can pay in full or in instalments.',
  },
  ...(v.category === 'planner'
    ? [
        {
          target: '[data-tour="vendor-tab-weddings"]',
          title: 'Plan alongside couples',
          text: 'Couples invite you to their weddings. As main planner you manage their vendors and budget; as co-planner you see everything and add notes.',
        },
      ]
    : []),
  ...(v.category === 'gifts'
    ? [{ target: '[data-tour="vendor-tab-orders"]', title: 'Your orders', text: 'What guests bought, for which couple, and where to deliver it.' }]
    : []),
  {
    target: '[data-tour="vendor-tab-payouts"]',
    title: 'Get paid',
    text: 'Add the bank account payments go to. Couples pay Paystack’s fee on top, so you receive the full amount.',
  },
]

const PROBLEM_LABELS: Record<string, string> = {
  description: 'Description',
  city: 'City',
  phone: 'Contact',
  coverImageId: 'Cover photo',
  packages: 'Packages',
}

function ReviewBanner({ vendor, onChange }: Props) {
  const [problems, setProblems] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    setProblems(null)
    try {
      onChange((await api.post<{ vendor: VendorListing }>('/vendor/submit')).vendor)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_ready') setProblems((err.details as { problems: Record<string, string> }).problems)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = vendor.status === 'draft' || vendor.status === 'rejected'

  if (vendor.status === 'approved') return <LiveListing vendor={vendor} />

  return (
    <section className="card" aria-labelledby="review-title" data-tour="vendor-review">
      <h2 id="review-title">
        {
          {
            draft: 'Finish your listing, then send it for review',
            pending: 'Your listing is waiting for review',
            rejected: 'Your listing needs a few changes',
            suspended: 'Your listing is suspended',
          }[vendor.status]
        }
      </h2>
      <p className="muted">
        {
          {
            draft: 'Couples can’t see you yet. Our team checks every listing before it goes into the marketplace, usually within two working days.',
            pending: 'We’ll email you when it’s been checked. You can keep editing in the meantime.',
            rejected: 'Make the changes below, then send it again.',
            suspended: 'Contact Alárinà support for help.',
          }[vendor.status]
        }
      </p>
      {vendor.reviewNote && (
        <p className="alert alert--info">
          <strong>From our team:</strong> {vendor.reviewNote}
        </p>
      )}
      {error && <p role="alert" className="alert">{error}</p>}
      {problems && (
        <div role="alert" className="alert">
          <p>A few more details first:</p>
          <ul>
            {Object.entries(problems).map(([key, text]) => (
              <li key={key}>
                <strong>{PROBLEM_LABELS[key] ?? key}:</strong> {text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {canSubmit && (
        <button type="button" className="btn" onClick={submit} disabled={busy}>
          {busy ? 'Sending…' : 'Send for review'}
        </button>
      )}
    </section>
  )
}

function Profile({ vendor, onChange }: Props) {
  const [draft, setDraft] = useState({
    businessName: vendor.businessName,
    category: vendor.category,
    description: vendor.description,
    city: vendor.city,
    phone: vendor.phone,
    email: vendor.email,
    website: vendor.website,
    instagram: vendor.instagram,
    priceFrom: nairaInput(vendor.priceFrom),
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const set = (key: keyof typeof draft) => (e: { target: { value: string } }) => setDraft({ ...draft, [key]: e.target.value })

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const { priceFrom, ...rest } = draft
      const { vendor: saved } = await api.patch<{ vendor: VendorListing }>('/vendor', {
        ...rest,
        priceFrom: priceFrom ? Number(priceFrom) : null,
      })
      onChange(saved)
      setMessage({ ok: true, text: 'Saved.' })
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="profile-title" data-tour="vendor-profile">
      <h2 id="profile-title">About your business</h2>
      <form onSubmit={save}>
        <Field label="Business name">
          {(p) => <input {...p} required maxLength={80} value={draft.businessName} onChange={set('businessName')} />}
        </Field>
        <Field label="What you do">
          {(p) => (
            <Select
              {...p}
              value={draft.category}
              onChange={(category) => setDraft({ ...draft, category: category as VendorCategory })}
              options={CATEGORY_IDS.map((id) => ({ value: id, label: VENDOR_CATEGORIES[id].label }))}
            />
          )}
        </Field>
        <Field label="Description" hint="What you offer, your style and what couples can expect. At least a few sentences.">
          {(p) => <textarea {...p} rows={6} maxLength={2000} value={draft.description} onChange={set('description')} />}
        </Field>
        <div className="field-row">
          <Field label="City">{(p) => <input {...p} maxLength={80} placeholder="Lagos" value={draft.city} onChange={set('city')} />}</Field>
          <Field label="Starting price" optional>
            {(p) => (
              <AmountInput {...p} min={MIN_PRICE_NAIRA} max={MAX_PRICE_NAIRA} placeholder={250000} value={draft.priceFrom} onChange={(priceFrom) => setDraft({ ...draft, priceFrom })} />
            )}
          </Field>
        </div>
        <div className="field-row">
          <Field label="Phone">{(p) => <input {...p} type="tel" maxLength={30} value={draft.phone} onChange={set('phone')} />}</Field>
          <Field label="Email">{(p) => <input {...p} type="email" maxLength={254} value={draft.email} onChange={set('email')} />}</Field>
        </div>
        <div className="field-row">
          <Field label="Website" optional>
            {(p) => <input {...p} type="url" maxLength={300} placeholder="https://" value={draft.website} onChange={set('website')} />}
          </Field>
          <Field label="Instagram" optional>
            {(p) => <input {...p} maxLength={60} placeholder="@yourbusiness" value={draft.instagram} onChange={set('instagram')} />}
          </Field>
        </div>
        {message && <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'alert alert--success' : 'alert'}>{message.text}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </section>
  )
}

const MAX_GALLERY = 12

function Photos({ vendor, onChange }: Props) {
  const [error, setError] = useState<string | null>(null)

  async function save(patch: { coverImageId?: string | null; gallery?: string[] }) {
    setError(null)
    try {
      onChange((await api.patch<{ vendor: VendorListing }>('/vendor', patch)).vendor)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <section className="card" aria-labelledby="photos-title">
      <h2 id="photos-title">Photos</h2>
      {error && <p role="alert" className="alert">{error}</p>}
      <ImageField label="Cover photo" optional={false} uploadPath={UPLOAD} value={vendor.coverImageId} onChange={(id) => save({ coverImageId: id })} />
      <p className="hint">Gallery: up to {MAX_GALLERY} photos of your work.</p>
      {vendor.gallery.length > 0 && (
        <ul className="vendor-gallery">
          {vendor.gallery.map((id) => (
            <li key={id}>
              <img className="thumb thumb--lg" src={imageSrc(id)} alt="" loading="lazy" />
              <button type="button" className="link-button" onClick={() => save({ gallery: vendor.gallery.filter((g) => g !== id) })}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {vendor.gallery.length < MAX_GALLERY && (
        <ImageField label="Add to gallery" uploadPath={UPLOAD} value={null} onChange={(id) => id && save({ gallery: [...vendor.gallery, id] })} />
      )}
    </section>
  )
}

/* ── Packages and products share one editor ─────────────────────────── */

type Draft = { name: string; description: string; price: string; imageId: string | null; active: boolean }

function Packages({ vendor, onChange }: Props) {
  return (
    <PricedItems
      title="Packages"
      intro="What couples can book, with a price for each. You can tailor a quote when they enquire."
      items={vendor.packages.map((p: VendorPackage) => ({ ...p, imageId: null, active: true }))}
      path="/vendor/packages"
      withPhoto={false}
      onChange={onChange}
    />
  )
}

function Products({ vendor, onChange }: Props) {
  return (
    <PricedItems
      title="Gift shop"
      intro="Products couples can add to their wishlist. Guests buy them, you’re paid, and you deliver to the couple."
      items={vendor.products.map((p: VendorProduct) => p)}
      path="/vendor/products"
      withPhoto
      onChange={onChange}
    />
  )
}

type Item = { id: string; name: string; description: string; price: number; imageId: string | null; active: boolean }

function PricedItems({
  title,
  intro,
  items,
  path,
  withPhoto,
  onChange,
}: {
  title: string
  intro: string
  items: Item[]
  path: string
  withPhoto: boolean
  onChange: (v: VendorListing) => void
}) {
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(item: Item) {
    setError(null)
    try {
      onChange((await api.delete<{ vendor: VendorListing }>(`${path}/${item.id}`)).vendor)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const form = (item: Item | null) => (
    <ItemForm
      initial={
        item
          ? { name: item.name, description: item.description, price: nairaInput(item.price), imageId: item.imageId, active: item.active }
          : { name: '', description: '', price: '', imageId: null, active: true }
      }
      withPhoto={withPhoto}
      onSave={async (draft) => {
        const body = {
          name: draft.name,
          description: draft.description,
          price: Number(draft.price),
          ...(withPhoto && { imageId: draft.imageId, active: draft.active }),
        }
        const { vendor } = item
          ? await api.put<{ vendor: VendorListing }>(`${path}/${item.id}`, body)
          : await api.post<{ vendor: VendorListing }>(path, body)
        onChange(vendor)
        setEditing(null)
      }}
      onCancel={() => setEditing(null)}
    />
  )

  return (
    <section className="card" aria-labelledby={`${path}-title`} data-tour="vendor-packages">
      <h2 id={`${path}-title`}>{title}</h2>
      <p className="muted">{intro}</p>
      {error && <p role="alert" className="alert">{error}</p>}
      {items.length > 0 && (
        <ul className="item-list">
          {items.map((item) =>
            editing === item.id ? (
              <li key={item.id}>{form(item)}</li>
            ) : (
              <li key={item.id}>
                <span className="item-main">
                  {item.imageId && <img className="thumb" src={imageSrc(item.imageId)} alt="" loading="lazy" />}
                  <span className="gift-name">
                    {item.name}
                    <span className="hint">
                      {formatNaira(item.price)}
                      {!item.active && ' · hidden'}
                    </span>
                    {item.description && <span className="hint">{item.description}</span>}
                  </span>
                </span>
                <span className="item-actions">
                  <button type="button" className="link-button" onClick={() => setEditing(item.id)}>
                    Edit<span className="visually-hidden"> {item.name}</span>
                  </button>
                  <button type="button" className="link-button" onClick={() => remove(item)}>
                    Remove<span className="visually-hidden"> {item.name}</span>
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
      {editing === 'new' ? (
        form(null)
      ) : (
        <button type="button" className="btn btn--secondary" onClick={() => setEditing('new')}>
          {items.length === 0 ? 'Add your first' : 'Add another'}
        </button>
      )}
    </section>
  )
}

function ItemForm({
  initial,
  withPhoto,
  onSave,
  onCancel,
}: {
  initial: Draft
  withPhoto: boolean
  onSave: (draft: Draft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave(draft)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form className="item-form" onSubmit={submit}>
      {error && <p role="alert" className="alert">{error}</p>}
      {withPhoto && <ImageField uploadPath={UPLOAD} value={draft.imageId} onChange={(imageId) => setDraft({ ...draft, imageId })} />}
      <Field label="Name">{(p) => <input {...p} required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}</Field>
      <Field label="Description" optional>
        {(p) => <textarea {...p} rows={3} maxLength={withPhoto ? 300 : 500} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />}
      </Field>
      <Field label="Price">
        {(p) => (
          <AmountInput {...p} required min={MIN_PRICE_NAIRA} max={MAX_PRICE_NAIRA} value={draft.price} onChange={(price) => setDraft({ ...draft, price })} />
        )}
      </Field>
      {withPhoto && (
        <label className="check">
          <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Show in the gift shop
        </label>
      )}
      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  )
}

/** Shown while the listing is live: petals drift across the panel, and the page is ready to share. */
function LiveListing({ vendor }: { vendor: VendorListing }) {
  const link = `${window.location.origin}/marketplace/${vendor.slug}`
  const message = `${vendor.businessName} is on Alárinà. See what we offer and book us here: ${link}`
  return (
    <section className="celebrate" aria-labelledby="review-title" data-tour="vendor-review">
      <Petals />
      <div className="celebrate-body">
        <p className="eyebrow">Approved</p>
        <h2 id="review-title">Your listing is live</h2>
        <p className="muted">Couples can find you in the marketplace now. Share your page so they can enquire and book. Changes you make show straight away.</p>
        <CopyLink link={link} label="Your marketplace page" />
        <div className="actions">
          <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
            Share on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
          <Link to={`/marketplace/${vendor.slug}`} className="btn btn--secondary">
            See your page
          </Link>
        </div>
      </div>
    </section>
  )
}
