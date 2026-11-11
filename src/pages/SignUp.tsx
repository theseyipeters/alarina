import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { homeFor } from '../auth/AuthContext.ts'
import { useAuth } from '../auth/useAuth.ts'
import { errorMessage } from '../lib/errors.ts'
import { safeNext, withNext } from '../lib/nav.ts'
import { useTitle } from '../lib/useTitle.ts'
import { CATEGORY_IDS, VENDOR_CATEGORIES, type VendorCategory } from '../lib/vendors.ts'
import AuthLayout from '../components/AuthLayout.tsx'
import Select from '../components/Select.tsx'
import { track } from '../lib/analytics.ts'

const COPY = {
  couple: {
    title: 'Plan your wedding together',
    intro: 'Invitations, replies and gifts in one space you share with your partner.',
    submit: 'Create account',
  },
  vendor: {
    title: 'List your business',
    intro: 'Reach couples while they plan. For planners, venues, caterers, gift shops and more.',
    submit: 'Create vendor account',
  },
}

export default function SignUp() {
  const [params, setParams] = useSearchParams()
  const asVendor = params.get('as') === 'vendor'
  const copy = COPY[asVendor ? 'vendor' : 'couple']
  useTitle(copy.title)
  const { state, signUp } = useAuth()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [category, setCategory] = useState('')

  if ((state.status === 'signedIn' || state.status === 'vendor') && !busy) return <Navigate to={next ?? homeFor(state)} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const account = { name: String(form.get('name')), email: String(form.get('email')), password: String(form.get('password')) }
    setBusy(true)
    setError(null)
    try {
      if (asVendor) {
        await signUp({
          ...account,
          kind: 'vendor',
          businessName: String(form.get('businessName')),
          category: category as VendorCategory,
        })
        // A planner arriving from a wedding's invite goes straight back to it.
        track('signup', { audience: 'vendor' })
        navigate(next ?? '/vendor', { replace: true })
      } else {
        await signUp(account)
        // Someone arriving from a partner invite goes straight back to it; a new couple invites their partner first.
        track('signup', { audience: 'couple' })
        navigate(next ?? '/partner', { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  // The choice lives in the address (?as=vendor), so links straight to either side keep working.
  // Replacing the entry keeps Back leaving the page, and what's typed so far stays in the form.
  function choose(vendor: boolean) {
    const to = new URLSearchParams(params)
    if (vendor) to.set('as', 'vendor')
    else to.delete('as')
    setError(null)
    setParams(to, { replace: true })
  }

  return (
    <AuthLayout audience={asVendor ? 'vendor' : 'couple'} personal>
      <div className="card">
        <fieldset className="auth-switch">
          <legend className="visually-hidden">What brings you to Alárinà?</legend>
          <div className="seg">
            <label>
              <input type="radio" className="visually-hidden" name="as" checked={!asVendor} onChange={() => choose(false)} />
              Planning a wedding
            </label>
            <label>
              <input type="radio" className="visually-hidden" name="as" checked={asVendor} onChange={() => choose(true)} />
              Vendor or planner
            </label>
          </div>
        </fieldset>
        <h1>{copy.title}</h1>
        <p className="muted">{copy.intro}</p>
        {error && <p role="alert" className="alert">{error}</p>}
        <form onSubmit={onSubmit}>
          {asVendor && (
            <>
              <div className="field">
                <label htmlFor="businessName">Business name</label>
                <input id="businessName" name="businessName" type="text" autoComplete="organization" required maxLength={80} placeholder="Ìfẹ́ Events" />
              </div>
              <div className="field">
                <label htmlFor="category">What you do</label>
                <Select
                  id="category"
                  required
                  value={category}
                  onChange={(c) => setCategory(c as VendorCategory)}
                  placeholder="Choose one"
                  options={CATEGORY_IDS.map((id) => ({ value: id, label: VENDOR_CATEGORIES[id].label }))}
                />
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" type="text" autoComplete="given-name" required maxLength={80} placeholder="Adaeze" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required minLength={8} maxLength={128} aria-describedby="password-hint" />
            <span id="password-hint" className="hint">At least 8 characters.</span>
          </div>
          <button className="btn btn--block" disabled={busy}>{busy ? 'Creating account…' : copy.submit}</button>
        </form>
        <p className="form-footer">
          Already have an account? <Link to={withNext('/signin', next)}>Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
