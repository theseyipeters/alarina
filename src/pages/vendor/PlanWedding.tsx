import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { formatDate, formatTime } from '../../lib/format.ts'
import { useTitle } from '../../lib/useTitle.ts'
import BudgetPanel from '../../planning/BudgetPanel.tsx'
import NotesPanel from '../../planning/NotesPanel.tsx'
import PlannersPanel from '../../planning/PlannersPanel.tsx'
import TeamPanel from '../../planning/TeamPanel.tsx'
import { ROLE_LABELS, type Summary } from '../../planning/types.ts'
import { useLoad } from '../../planning/useLoad.ts'
import '../../planning/planning.css'
import '../Gifts.css'

/** A planner's board for one wedding: the day at a glance, vendors, budget, planners and notes. */
export default function PlanWedding() {
  const { weddingId = '' } = useParams()
  const [state] = useLoad<Summary>(`/planning/${weddingId}/summary`)
  const [view, setView] = useState<'vendors' | 'budget'>('vendors')
  useTitle(state.status === 'ready' ? state.data.wedding.names : 'Wedding')

  if (state.status === 'loading') return <p className="muted">Loading the wedding…</p>
  if (state.status === 'error') return <p role="alert" className="alert">{state.message}</p>
  const { role, wedding: w, guests } = state.data

  return (
    <div className="gifts">
      <Link to="/vendor/weddings" className="link-button">← All weddings</Link>
      <section className="gifts-hero">
        <div>
          <p className="eyebrow">{ROLE_LABELS[role]}</p>
          <h1>{w.names}</h1>
          <p className="muted">
            {[w.date && formatDate(w.date), w.startTime && formatTime(w.startTime), w.venueName].filter(Boolean).join(' · ')}
            {w.receptionVenueName && ` · reception at ${w.receptionVenueName}`}
          </p>
          <p className="muted">
            {guests.attending} coming · {guests.declined} can’t make it
          </p>
        </div>
      </section>
      <nav className="tabs" aria-label="Planning">
        <button type="button" className="tab" aria-current={view === 'vendors' ? 'page' : undefined} onClick={() => setView('vendors')}>Vendors</button>
        <button type="button" className="tab" aria-current={view === 'budget' ? 'page' : undefined} onClick={() => setView('budget')}>Budget</button>
      </nav>
      {view === 'vendors' ? (
        <div className="gifts-grid">
          <TeamPanel weddingId={w.id} role={role} />
          <div className="stack">
            <PlannersPanel weddingId={w.id} role={role} />
            <NotesPanel weddingId={w.id} role={role} />
          </div>
        </div>
      ) : (
        <BudgetPanel weddingId={w.id} />
      )}
    </div>
  )
}
