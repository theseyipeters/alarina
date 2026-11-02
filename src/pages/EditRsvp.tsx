import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { inviteAttrs } from '../invite/design.ts'
import GiftBasket from '../invite/GiftBasket.tsx'
import RsvpForm from '../invite/RsvpForm.tsx'
import '../invite/styles.ts'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { coupleNames, formatDate } from '../lib/format.ts'
import type { PublicInvitation, Rsvp } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type Loaded = { rsvp: Rsvp; invitation: PublicInvitation; editExpiresAt: string }
type State = { status: 'loading' } | { status: 'invalid'; message: string } | ({ status: 'ready' } & Loaded)

/** A guest's private page for changing their reply, themed like the invitation it belongs to. */
export default function EditRsvp() {
  useTitle('Your RSVP')
  const { token = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const path = `/public/rsvps/${encodeURIComponent(token)}`

  useEffect(() => {
    let cancelled = false
    api.get<Loaded>(path).then(
      (data) => !cancelled && setState({ status: 'ready', ...data }),
      (err) => !cancelled && setState({ status: 'invalid', message: errorMessage(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [path])

  if (state.status === 'loading') return <p className="page muted">Opening your RSVP…</p>
  if (state.status === 'invalid') {
    return (
      <main id="main" className="page">
        <div className="card">
          <h1>This link doesn’t work</h1>
          <p className="muted">{state.message}</p>
        </div>
      </main>
    )
  }

  const { rsvp, invitation, editExpiresAt } = state
  const names = coupleNames(invitation.partnerOneName, invitation.partnerTwoName)

  async function save(values: { name: string; phone: string; attending: boolean }) {
    setSaved(false)
    setError(null)
    try {
      const updated = await api.patch<Loaded>(path, { name: values.name, phone: values.phone, attending: values.attending })
      setState({ status: 'ready', ...updated })
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'rsvp_link_invalid' ? err.message : errorMessage(err))
    }
  }

  return (
    <div className="inv" {...inviteAttrs(invitation)}>
      <main id="main" className="inv-column">
        <section className="inv-panel" aria-labelledby="edit-heading">
          <p className="inv-eyebrow">Your RSVP for</p>
          <h1 id="edit-heading">{names}</h1>
          <p className="muted">
            {formatDate(invitation.date)}
            {invitation.venueName && ` · ${invitation.venueName}`}
          </p>
          <p>
            You’ve {rsvp.attending ? 'accepted' : 'declined'}. You can change your reply until{' '}
            {formatDate(editExpiresAt.slice(0, 10))}.
          </p>
          {saved && <p role="status" className="alert alert--success">Your reply has been updated.</p>}
          {error && <p role="alert" className="alert">{error}</p>}
          <RsvpForm initial={rsvp} emailLocked submitLabel="Save changes" busyLabel="Saving…" onSubmit={save} />
        </section>
        {/* Guests who replied before the couple unlocked Gifts can still give from here. */}
        <section className="inv-panel">
          <GiftBasket invitation={invitation} names={names} guest={{ name: rsvp.name, email: rsvp.email, phone: rsvp.phone }} rsvpToken={token} />
        </section>
        <p className="inv-footer">
          <Link to={`/invite/${invitation.slug}`}>View the invitation</Link>
        </p>
      </main>
    </div>
  )
}
