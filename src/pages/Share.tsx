import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import CopyLink from '../components/CopyLink.tsx'
import UnlockCallout from '../components/UnlockCallout.tsx'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import type { ShareLinks } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'none' } | { status: 'ready'; data: ShareLinks }

const whatsapp = (link: string) =>
  `https://wa.me/?text=${encodeURIComponent(`You're invited to our wedding. Please reply here: ${link}`)}`

/** Each partner's personal link, so replies are attributed to the right side of the family. */
export default function Share() {
  useTitle('Share your invitation')
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<ShareLinks>('/wedding/share-links').then(
        (data) => setState({ status: 'ready', data }),
        (err: unknown) =>
          setState(err instanceof ApiError && err.code === 'no_wedding' ? { status: 'none' } : { status: 'error', message: errorMessage(err) }),
      ),
    [],
  )

  useEffect(() => {
    void load()
  }, [load])

  if (state.status === 'loading') return <Loading label="Loading your links" />
  if (state.status === 'error') return <LoadError title="Your links didn’t load" message={state.message} onRetry={load} />

  const data = state.status === 'ready' ? state.data : null
  if (!data?.generalLink) {
    return (
      <EmptyState
        card
        icon="envelope"
        title="Nothing to share yet"
        action={<Link to={data ? '/app' : '/app/setup'} className="btn">{data ? 'Go to overview' : 'Set up your wedding'}</Link>}
      >
        Your links appear here once your invitation is published: one for each of you, so replies are marked with the right side.
      </EmptyState>
    )
  }

  const ordered = [...data.links].sort((a, b) => Number(b.isYou) - Number(a.isYou))

  return (
    <div className="stack">
      <div>
        <h1>Share your invitation</h1>
        <p className="muted">
          Each of you has your own link. Replies that come through it are marked as your side, so you can see who’s
          coming from each family. It works on trust: anyone with a link can use it.
        </p>
      </div>

      <UnlockCallout where="share" />

      {ordered.map((l) => (
        <section key={l.userId} className="card" aria-labelledby={`link-${l.userId}`}>
          <h2 id={`link-${l.userId}`}>{l.isYou ? 'Your link' : `${l.name}’s link`}</h2>
          <p className="muted">
            {l.isYou
              ? 'Share this with your side of the family and your friends.'
              : `For ${l.name} to share with their side.`}
          </p>
          {l.link && (
            <>
              <CopyLink link={l.link} label={l.isYou ? 'Your share link' : `${l.name}’s share link`} />
              <a className="btn btn--secondary" href={whatsapp(l.link)} target="_blank" rel="noopener noreferrer">
                Share on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </>
          )}
        </section>
      ))}

      {data.links.length < 2 && (
        <p className="muted">
          Your partner’s link appears here once they join. <Link to="/partner">Invite your partner</Link>
        </p>
      )}

      <section className="card" aria-labelledby="general-link">
        <h2 id="general-link">General link</h2>
        <p className="muted">For anyone else. Replies through this link aren’t marked with a side; you can set it later.</p>
        <CopyLink link={data.generalLink} label="General invitation link" event="invite_link_copied" />
      </section>
    </div>
  )
}
