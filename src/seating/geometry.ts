import type { Plan, Point, Table } from './types.ts'

// Keep in step with be/src/lib/seating.ts (tableSize, seatPositions), which the server uses for
// distances; the two must draw and measure the same tables.

export function tableSize(t: Pick<Table, 'shape' | 'seats'>) {
  if (t.shape === 'round') {
    const d = Math.max(1.2, (t.seats * 0.6) / Math.PI)
    return { w: d, h: d }
  }
  return { w: Math.max(1.4, Math.ceil(t.seats / 2) * 0.7), h: 0.9 }
}

/** Seat centres, numbered from 1: clockwise from the top on round tables, along the sides on long ones. */
export function seatPositions(t: Table): Point[] {
  const { w, h } = tableSize(t)
  const out: Point[] = []
  if (t.shape === 'round') {
    const r = w / 2 + 0.35
    for (let i = 0; i < t.seats; i++) {
      const a = -Math.PI / 2 + (i / t.seats) * Math.PI * 2
      out.push({ x: t.x + r * Math.cos(a), y: t.y + r * Math.sin(a) })
    }
    return out
  }
  const perSide = Math.ceil(t.seats / 2)
  const rot = ((t.rotation ?? 0) * Math.PI) / 180
  for (let i = 0; i < t.seats; i++) {
    const side = i < perSide ? -1 : 1
    const k = i < perSide ? i : i - perSide
    const along = -w / 2 + (w / perSide) * (k + 0.5)
    const across = side * (h / 2 + 0.35)
    out.push({ x: t.x + along * Math.cos(rot) - across * Math.sin(rot), y: t.y + along * Math.sin(rot) + across * Math.cos(rot) })
  }
  return out
}

export const snap = (n: number, step = 0.5) => Math.round(n / step) * step
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** A spot for a new table: the first grid point that doesn't overlap another table, else the middle. */
export function freeSpot(plan: Plan): Point {
  for (let y = 12; y < plan.depth - 2; y += 3.2) {
    for (let x = 2.5; x < plan.width - 2; x += 3.2) {
      if (plan.tables.every((t) => Math.hypot(t.x - x, t.y - y) > 2.8)) return { x: snap(x), y: snap(y) }
    }
  }
  return { x: snap(plan.width / 2), y: snap(plan.depth / 2) }
}

/** The largest table id number in use, so new tables get fresh ids. */
export const nextId = (prefix: string, ids: string[]) => {
  const n = ids.map((id) => Number(id.replace(/\D/g, '')) || 0)
  return `${prefix}${Math.max(0, ...n) + 1}`
}

/** Seats taken at each table, from the parties seated there. */
export const takenByTable = (parties: { tableId: string | null; seats: number[] }[]) => {
  const map = new Map<string, number[]>()
  for (const p of parties) if (p.tableId) map.set(p.tableId, [...(map.get(p.tableId) ?? []), ...p.seats])
  return map
}
