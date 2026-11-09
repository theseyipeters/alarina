import { lazy, Suspense, useState } from 'react'
import FloorPlan from './FloorPlan.tsx'
import PerspectiveView from './PerspectiveView.tsx'
import type { GuestSeating } from './types.ts'
import './seating.css'

// The 3D hall pulls in three.js, so it only loads for guests who open it.
const Hall3D = lazy(() => import('./Hall3D.tsx'))

const SIDE = { left: 'left of centre', right: 'right of centre', centre: 'centre' }

/** "You're with Bisi, Kunle and 6 others" */
function withWhom(s: GuestSeating) {
  if (s.otherPeople === 0) return 'You’re the first at this table so far.'
  const named = s.tablemates.slice(0, 3)
  const more = s.otherPeople - named.length
  const list = more > 0 ? [...named, `${more} ${more === 1 ? 'other' : 'others'}`] : named
  return `You’re with ${list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0]}.`
}

/**
 * Where a guest sits, before the day, like a cinema's "View from F8": their table and seats, how
 * far from the stage, who they're with, the hall from above with the way in, and the view from
 * their seat in the style the couple chose.
 */
export default function GuestTableCard({ seating: s, preview }: { seating: GuestSeating; preview?: boolean }) {
  const [open, setOpen] = useState(preview ?? false)

  return (
    <section className="card table-card" aria-labelledby={`table-card-${s.view}`}>
      <p className="eyebrow table-card-spot">{s.spotLabel}</p>
      <h2 id={`table-card-${s.view}`}>
        {s.table.name}
        {s.seatsLabel && <span className="muted"> · {s.seatsLabel}</span>}
      </h2>
      <p className="muted">{withWhom(s)}</p>

      <dl className="table-stats">
        <div>
          <dt>to the stage</dt>
          <dd>{s.toStage} m</dd>
        </div>
        <div>
          <dt>{s.side === 'centre' ? 'position' : SIDE[s.side]}</dt>
          <dd>{s.side === 'centre' ? 'Centre' : `${s.offCentre} m`}</dd>
        </div>
        <div>
          <dt>from the entrance</dt>
          <dd>{s.steps} steps</dd>
        </div>
      </dl>

      <FloorPlan
        plan={s.plan}
        highlight={{ tableId: s.table.id, seats: s.seats }}
        route={s.route}
        className="floor-plan--guest"
        label={`The hall from above. ${s.table.name} is highlighted, with the way from the entrance.`}
      />

      {!preview && (
        <button type="button" className="btn btn--secondary" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Hide the view' : 'View from your table'}
        </button>
      )}
      {open &&
        (s.view === '3d' ? (
          <Suspense fallback={<p className="muted">Loading the hall…</p>}>
            <Hall3D seating={s} />
          </Suspense>
        ) : (
          <PerspectiveView seating={s} />
        ))}
    </section>
  )
}
