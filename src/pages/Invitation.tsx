import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import CopyLink from '../components/CopyLink.tsx'
import InvitationCard from '../invite/InvitationCard.tsx'
import RsvpForm from '../invite/RsvpForm.tsx'
import '../invite/styles.ts'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { coupleNames } from '../lib/format.ts'
import type { PublicInvitation, Rsvp } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

type State =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready'; invitation: PublicInvitation }

export default function Invitation() {
  const { slug = '' } = useParams()
  // A partner's personal link adds ?from=code, so the reply is marked as their side.
  const from = useSearchParams()[0].get('from')
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get<{ invitation: PublicInvitation }>(`/public/invitations/${encodeURIComponent(slug)}`).then(
      ({ invitation }) => !cancelled && setState({ status: 'ready', invitation }),
      (err) => !cancelled && setState({ status: err instanceof ApiError && err.status === 404 ? 'missing' : 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [slug])

  const names = state.status === 'ready' ? coupleNames(state.invitation.partnerOneName, state.invitation.partnerTwoName) : ''
  useTitle(names ? `${names} are getting married` : 'Wedding invitation')

  if (state.status === 'loading') return <p className="page muted">Opening the invitation…</p>
  if (state.status !== 'ready') {
    return (
      <main id="main" className="page">
        <div className="card">
          <h1>{state.status === 'missing' ? 'Invitation not available' : 'Something went wrong'}</h1>
          <p className="muted">
            {state.status === 'missing'
              ? 'This invitation hasn’t been published, or the link is incorrect. Check with the couple for the right link.'
              : 'The invitation couldn’t be loaded. Check your connection and refresh the page.'}
          </p>
        </div>
      </main>
    )
  }

  const { invitation } = state
  return (
    <div className="inv" data-palette={invitation.palette} data-template={invitation.template}>
      <main id="main" className="inv-column">
        <InvitationCard invitation={invitation} />
        <RsvpPanel invitation={invitation} names={names} from={from} />
        <p className="inv-footer">
          Made with <Link to="/">Alárinà</Link>
        </p>
      </main>
    </div>
  )
}

type Created = { rsvp: Rsvp; editLink: string; emailSent: boolean }

function RsvpPanel({ invitation, names, from }: { invitation: PublicInvitation; names: string; from: string | null }) {
  const [created, setCreated] = useState<Created | null>(null)
  const [duplicate, setDuplicate] = useState<{ emailSent: boolean } | null>(null)
  const [closed, setClosed] = useState(!invitation.rsvpOpen)
  const [error, setError] = useState<string | null>(null)

  async function submit(values: { name: string; email: string; phone: string; attending: boolean }) {
    setError(null)
    setDuplicate(null)
    try {
      setCreated(
        await api.post<Created>(`/public/invitations/${encodeURIComponent(invitation.slug)}/rsvps`, {
          ...values,
          ...(from && { from }),
        }),
      )
    } catch (err) {
      if (err instanceof ApiError && err.code === 'already_responded') {
        setDuplicate(err.details as { emailSent: boolean })
      } else if (err instanceof ApiError && err.code === 'rsvp_closed') {
        setClosed(true)
      } else {
        setError(errorMessage(err))
      }
    }
  }

  if (created) {
    const { rsvp, editLink, emailSent } = created
    return (
      <section className="inv-panel" aria-labelledby="rsvp-heading" role="status">
        <h2 id="rsvp-heading">Thank you, {rsvp.name}</h2>
        <p>
          {rsvp.attending ? `${names} will be so glad you’re coming.` : `Thanks for letting ${names} know.`}
        </p>
        <p className="muted">
          Here is your private link to change your reply. Keep it to yourself: anyone with it can change your reply.
        </p>
        <CopyLink link={editLink} label="Your private RSVP link" />
        {emailSent && <p className="hint">We’ve also emailed it to you.</p>}
        <p>
          <Link to={new URL(editLink).pathname}>Change my reply</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="inv-panel" aria-labelledby="rsvp-heading">
      <h2 id="rsvp-heading">RSVP</h2>
      {closed ? (
        <p className="muted">
          {invitation.rsvpClosedReason === 'past'
            ? 'This wedding has already taken place.'
            : 'RSVPs have closed. If you need to change your plans, contact the couple directly.'}
        </p>
      ) : (
        <>
          <p className="muted">Let {names} know if you can make it.</p>
          {duplicate && (
            <p role="alert" className="alert">
              You’ve already replied with this email.{' '}
              {duplicate.emailSent
                ? 'We’ve emailed you a new link to change your reply.'
                : 'Use the private link you got when you replied to change it.'}
            </p>
          )}
          {error && <p role="alert" className="alert">{error}</p>}
          <RsvpForm submitLabel="Send reply" busyLabel="Sending…" onSubmit={submit} />
        </>
      )}
    </section>
  )
}
