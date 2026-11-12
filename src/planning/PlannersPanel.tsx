import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import CopyLink from '../components/CopyLink.tsx'
import Field from '../components/Field.tsx'
import Select from '../components/Select.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { ROLE_LABELS, type Planner, type PlanningRole } from './types.ts'
import { useLoad } from './useLoad.ts'

/**
 * Who's planning this wedding. Only the couple invites planners, chooses the main one and removes
 * them; planners see who else is on it. A planner can be invited from their marketplace page, or by link.
 */
export default function PlannersPanel({ weddingId, role }: { weddingId: string; role: PlanningRole }) {
  const [state, reload] = useLoad<{ planners: Planner[] }>(`/planning/${weddingId}/planners`)
  const [error, setError] = useState<string | null>(null)

  async function run(work: () => Promise<unknown>) {
    setError(null)
    try {
      await work()
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (state.status !== 'ready') return null
  const planners = state.data.planners
  const hasMain = planners.some((p) => p.role === 'main' && p.status === 'active')

  return (
    <section className="card" aria-labelledby="planners-title" data-tour="planners">
      <h2 id="planners-title">Planners</h2>
      <p className="muted">
        {role === 'couple'
          ? 'A main planner looks after your vendors and budget alongside you. Co-planners can see everything and add notes. Only you invite planners, and you can change their roles or remove them at any time.'
          : 'Who’s planning this wedding with the couple. Only the couple can invite or remove planners.'}
      </p>
      {error && <p role="alert" className="alert">{error}</p>}
      {planners.length > 0 && (
        <ul className="item-list">
          {planners.map((p) => (
            <li key={p.id}>
              <span className="gift-name">
                {p.vendorSlug ? <Link to={`/marketplace/${p.vendorSlug}`}>{p.businessName}</Link> : (p.businessName ?? p.email ?? 'Invite link')}
                <span className="hint">
                  {ROLE_LABELS[p.role]}
                  {p.status === 'invited' && (p.expired ? ' · invite expired' : ' · invited')}
                </span>
              </span>
              <span className="item-actions">
                {role === 'couple' && p.status === 'active' && p.role === 'co' && (
                  <button type="button" className="link-button" onClick={() => run(() => api.patch(`/planning/${weddingId}/planners/${p.id}`, { role: 'main' }))}>
                    Make main planner
                  </button>
                )}
                {role === 'couple' && (
                  <button type="button" className="link-button" onClick={() => run(() => api.delete(`/planning/${weddingId}/planners/${p.id}`))}>
                    {p.status === 'invited' ? 'Cancel invite' : 'Remove'}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {role === 'couple' && <InviteForm weddingId={weddingId} canInviteMain={!hasMain} onInvited={reload} />}
      {role === 'couple' && (
        <p className="hint">
          Looking for a planner? <Link to="/marketplace?category=planner">Browse planners</Link> and invite one from their page.
        </p>
      )}
    </section>
  )
}

function InviteForm({ weddingId, canInviteMain, onInvited }: { weddingId: string; canInviteMain: boolean; onInvited: () => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'main' | 'co'>(canInviteMain ? 'main' : 'co')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<{ link: string; emailSent: boolean } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await api.post<{ link: string; emailSent: boolean }>(`/planning/${weddingId}/planners`, { role, ...(email && { email }) })
      setSent(result)
      setEmail('')
      await onInvited()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="item-form">
      <h3>Invite a planner by link</h3>
      {error && <p role="alert" className="alert">{error}</p>}
      {sent && (
        <div className="alert alert--success" role="status">
          <p>{sent.emailSent ? 'Invite sent. You can also share this link:' : 'Share this link with your planner. It works once.'}</p>
          <CopyLink link={sent.link} label="Planner invite link" />
        </div>
      )}
      <Field label="Their email" optional hint="We’ll email them the link. They’ll need a planner account on Alárinà to accept.">
        {(p) => <input {...p} type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      {canInviteMain && (
        <Field label="Role">
          {(p) => (
            <Select
              {...p}
              value={role}
              onChange={(r) => setRole(r as 'main' | 'co')}
              options={[
                { value: 'main', label: 'Main planner' },
                { value: 'co', label: 'Co-planner' },
              ]}
            />
          )}
        </Field>
      )}
      <button className="btn btn--secondary" disabled={busy}>{busy ? 'Creating…' : 'Create invite'}</button>
    </form>
  )
}
