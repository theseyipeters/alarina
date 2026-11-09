// The seating API's shapes (be/src/routes/seating.ts). Positions and sizes are metres from the
// hall's front-left corner: x across, y from the stage end towards the back.

export type FeatureKind = 'stage' | 'high_table' | 'dance_floor' | 'entrance' | 'dj' | 'bar'
export type Feature = { id: string; kind: FeatureKind; label: string | null; x: number; y: number; w: number; h: number }
export type Table = { id: string; name: string; shape: 'round' | 'long'; seats: number; x: number; y: number; rotation: number }
export type Plan = { width: number; depth: number; features: Feature[]; tables: Table[] }
export type Point = { x: number; y: number }
export type ViewStyle = 'perspective' | '3d'

export type SharedPlan = Plan & { shared: boolean; sharedAt: string | null; view: ViewStyle }

export type Party = { id: string; name: string; firstName: string; partySize: number; sideUserId: string | null; tableId: string | null; seats: number[] }

export type Seating = {
  role: 'couple' | 'main' | 'co'
  canEdit: boolean
  plan: SharedPlan
  parties: Party[]
  totals: { people: number; seated: number; unseated: number; capacity: number; free: number }
}

/** What a guest (or the team, previewing a table) sees about a seat. */
export type GuestSeating = {
  view: ViewStyle
  plan: Plan
  table: Table
  seats: number[]
  seatsLabel: string
  tablemates: string[]
  otherPeople: number
  spot: 'front_row' | 'sweet_spot' | 'dance_floor' | 'back' | 'good_view'
  spotLabel: string
  toStage: number
  side: 'left' | 'right' | 'centre'
  offCentre: number
  steps: number
  route: Point[]
}

export const FEATURE_LABELS: Record<FeatureKind, string> = {
  stage: 'Stage',
  high_table: 'High table',
  dance_floor: 'Dance floor',
  entrance: 'Entrance',
  dj: 'DJ',
  bar: 'Bar',
}
