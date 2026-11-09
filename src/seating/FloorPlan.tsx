import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { clamp, seatPositions, snap, tableSize } from './geometry.ts'
import { FEATURE_LABELS, type Feature, type Plan, type Point } from './types.ts'

type Props = {
  plan: Plan
  /** Taken seat numbers by table id: drawn filled. */
  taken?: Map<string, number[]>
  /** Drag tables and features around (snapped to half a metre), reported when let go. */
  editable?: boolean
  onMove?: (kind: 'table' | 'feature', id: string, at: Point) => void
  selected?: string | null
  onSelect?: (tableId: string | null) => void
  /** A party dragged from the guest list onto a table. */
  onDropParty?: (tableId: string, rsvpId: string) => void
  /** A guest's view: their table, their seats, and the way in. */
  highlight?: { tableId: string; seats: number[] }
  route?: Point[]
  className?: string
  label?: string
}

const FEATURE_CLASS: Record<Feature['kind'], string> = {
  stage: 'fp-stage',
  high_table: 'fp-high',
  dance_floor: 'fp-dance',
  entrance: 'fp-entrance',
  dj: 'fp-extra',
  bar: 'fp-extra',
}

/**
 * The hall from above, drawn in metres so every view (editor, guest card, perspective, 3D) agrees.
 * The stage end is at the top, like the screen in a cinema seat map.
 */
export default function FloorPlan({ plan, taken, editable, onMove, selected, onSelect, onDropParty, highlight, route, className, label }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  // While dragging: what, and where it is now (shown live, saved on release).
  const [drag, setDrag] = useState<{ kind: 'table' | 'feature'; id: string; at: Point; grab: Point } | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const toPlan = (e: { clientX: number; clientY: number }): Point => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return { x: p.x, y: p.y }
  }

  function startDrag(e: ReactPointerEvent, kind: 'table' | 'feature', id: string, centre: Point) {
    if (!editable) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const p = toPlan(e)
    setDrag({ kind, id, at: centre, grab: { x: p.x - centre.x, y: p.y - centre.y } })
    if (kind === 'table') onSelect?.(id)
  }

  function moveDrag(e: ReactPointerEvent) {
    if (!drag) return
    const p = toPlan(e)
    setDrag({ ...drag, at: { x: clamp(snap(p.x - drag.grab.x), 0.5, plan.width - 0.5), y: clamp(snap(p.y - drag.grab.y), 0.5, plan.depth - 0.5) } })
  }

  function endDrag() {
    if (!drag) return
    onMove?.(drag.kind, drag.id, drag.at)
    setDrag(null)
  }

  const posOf = <T extends { id: string; x: number; y: number }>(kind: 'table' | 'feature', item: T): T =>
    drag && drag.kind === kind && drag.id === item.id ? { ...item, x: drag.at.x, y: drag.at.y } : item

  return (
    <svg
      ref={svgRef}
      className={`floor-plan ${className ?? ''}`}
      viewBox={`-0.5 -0.5 ${plan.width + 1} ${plan.depth + 1}`}
      role="img"
      aria-label={label ?? `Floor plan, ${plan.width} by ${plan.depth} metres, ${plan.tables.length} tables`}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={() => setDrag(null)}
      onPointerDown={() => editable && onSelect?.(null)}
    >
      <rect className="fp-hall" x={0} y={0} width={plan.width} height={plan.depth} rx={0.4} />

      {plan.features.map((raw) => {
        const f = posOf('feature', raw)
        return (
          <g key={f.id} className={`fp-feature ${FEATURE_CLASS[f.kind]}`} onPointerDown={(e) => startDrag(e, 'feature', f.id, f)} style={editable ? { cursor: 'grab' } : undefined}>
            <rect x={f.x - f.w / 2} y={f.y - f.h / 2} width={f.w} height={f.h} rx={f.kind === 'dance_floor' ? 0.3 : 0.15} />
            <text x={f.x} y={f.y} dominantBaseline="middle" textAnchor="middle">{f.label || FEATURE_LABELS[f.kind]}</text>
          </g>
        )
      })}

      {route && route.length > 1 && <polyline className="fp-route" points={route.map((p) => `${p.x},${p.y}`).join(' ')} />}

      {plan.tables.map((raw) => {
        const t = posOf('table', raw)
        const { w, h } = tableSize(t)
        const seats = seatPositions(t)
        const takenSeats = new Set(taken?.get(t.id) ?? [])
        const mine = highlight?.tableId === t.id
        const mySeats = new Set(mine ? highlight.seats : [])
        const full = taken && takenSeats.size >= t.seats
        const over = taken && takenSeats.size > t.seats
        const classes = ['fp-table', mine && 'is-mine', selected === t.id && 'is-selected', dropTarget === t.id && 'is-drop', full && 'is-full', over && 'is-over']
        return (
          <g
            key={t.id}
            className={classes.filter(Boolean).join(' ')}
            onPointerDown={(e) => startDrag(e, 'table', t.id, t)}
            onDragOver={(e) => {
              if (!onDropParty) return
              e.preventDefault()
              setDropTarget(t.id)
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDropTarget(null)
              const id = e.dataTransfer.getData('text/x-rsvp')
              if (id) onDropParty?.(t.id, id)
            }}
            style={editable ? { cursor: 'grab' } : undefined}
          >
            {seats.map((s, i) => (
              <circle key={i} className={mySeats.has(i + 1) ? 'fp-seat is-mine' : takenSeats.has(i + 1) ? 'fp-seat is-taken' : 'fp-seat'} cx={s.x} cy={s.y} r={0.24} />
            ))}
            {t.shape === 'round' ? (
              <circle className="fp-top" cx={t.x} cy={t.y} r={w / 2} />
            ) : (
              <rect className="fp-top" x={t.x - w / 2} y={t.y - h / 2} width={w} height={h} rx={0.1} transform={`rotate(${t.rotation ?? 0} ${t.x} ${t.y})`} />
            )}
            {t.name && (
              <text className="fp-name" x={t.x} y={t.y - (taken ? 0.18 : 0)} dominantBaseline="middle" textAnchor="middle">
                {t.name.replace(/^Table\s+/i, 'T')}
              </text>
            )}
            {taken && (
              <text className="fp-count" x={t.x} y={t.y + 0.38} dominantBaseline="middle" textAnchor="middle">
                {takenSeats.size}/{t.seats}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
