import { useEffect, useState } from 'react'
import FloorPlan from './FloorPlan.tsx'
import type { GuestSeating } from './types.ts'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The hall tilted towards the stage, with a camera sweep like the cinema video: it starts at the
 * entrance and glides to the guest's table. CSS 3D only, so it's quick on any phone.
 */
export default function PerspectiveView({ seating: s }: { seating: GuestSeating }) {
  const start = s.route[0] ?? { x: s.plan.width / 2, y: s.plan.depth }
  // 'enter': looking in from the door; 'seat': settled on their table.
  const [stage, setStage] = useState<'enter' | 'seat'>(reducedMotion() ? 'seat' : 'enter')

  useEffect(() => {
    if (stage === 'seat') return
    const id = window.setTimeout(() => setStage('seat'), 350)
    return () => window.clearTimeout(id)
  }, [stage])

  const focus = stage === 'enter' ? start : { x: s.table.x, y: s.table.y }
  // As percentages of the plan, which is drawn with half a metre of margin on every side.
  const fx = ((focus.x + 0.5) / (s.plan.width + 1)) * 100
  const fy = ((focus.y + 0.5) / (s.plan.depth + 1)) * 100
  const zoom = stage === 'enter' ? 1.3 : 2.1

  return (
    <div className="perspective" aria-label={`A view across the hall from ${s.table.name}, towards the stage`} role="img">
      <div
        className="perspective-plane"
        style={{
          aspectRatio: `${s.plan.width + 1} / ${s.plan.depth + 1}`,
          transformOrigin: `${fx}% ${fy}%`,
          // Turn and zoom about the focus point, then shift so it lands on the anchor in the middle of the view.
          transform: `translate(${-fx}%, ${-fy}%) rotateX(${stage === 'enter' ? 62 : 54}deg) scale(${zoom})`,
        }}
      >
        <FloorPlan plan={s.plan} highlight={{ tableId: s.table.id, seats: s.seats }} route={s.route} />
      </div>
      <button type="button" className="btn btn--secondary perspective-replay" onClick={() => setStage('enter')}>
        Walk in again
      </button>
    </div>
  )
}
