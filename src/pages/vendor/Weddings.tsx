import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../../lib/api.ts'
import { errorMessage } from '../../lib/errors.ts'
import { formatDate } from '../../lib/format.ts'
import { useTitle } from '../../lib/useTitle.ts'
import { ROLE_LABELS } from '../../planning/types.ts'
import { useLoad } from '../../planning/useLoad.ts'
import '../Gifts.css'

type Row = { id: string; weddingId: string; names: string; date: string | null; venueName: string | null; role: 'main' | 'co' }

/** A planner's weddings, and couples' invitations to plan with them. */
export default function Weddings() {
  useTitle('Weddings')
  const [state, reload] = useLoad<{ weddings: Row[]; invites: Row[] }>('/planning')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  if (state.status === 'loading') return <p className="muted">Loading weddings…</p>
  if (state.status === 'error') return <p role="alert" className="alert">{state.message}</p>
  const { weddings, invites } = state.data

  async function answer(invite: Row, accept: boolean) {
    setError(null)
    try {
      if (accept) {
        const { weddingId } = await api.post<{ weddingId: string }>(`/planning/invites/${invite.id}/accept`)
        navigate(`/vendor/weddings/${weddingId}`)
      } else {
        await api.post(`/planning/invites/${invite.id}/decline`)
        await reload()
      }
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const meta = (w: Row) => [w.date && formatDate(w.date), w.venueName, ROLE_LABELS[w.role]].filter(Boolean).join(' · ')

  return (
    <div className="gifts">
      {error && <p role="alert" className="alert">{error}</p>}
      {invites.length > 0 && (
        <section className="card" aria-labelledby="invites-title">
          <h2 id="invites-title">Invitations to plan</h2>
          <ul className="item-list">
            {invites.map((i) => (
              <li key={i.id}>
                <span className="gift-name">
                  {i.names}
                  <span className="hint">{meta(i)}</span>
                </span>
                <span className="item-actions">
                  <button type="button" className="btn" onClick={() => answer(i, true)}>Accept</button>
                  <button type="button" className="link-button" onClick={() => answer(i, false)}>Decline</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="card" aria-labelledby="weddings-title" data-tour="vendor-weddings">
        <h2 id="weddings-title">Weddings you’re planning</h2>
        {weddings.length === 0 ? (
          <p className="board-empty">None yet. Couples can invite you from your marketplace page, or send you a link.</p>
        ) : (
          <ul className="item-list">
            {weddings.map((w) => (
              <li key={w.id}>
                <span className="gift-name">
                  <Link to={`/vendor/weddings/${w.weddingId}`}>{w.names}</Link>
                  <span className="hint">{meta(w)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
