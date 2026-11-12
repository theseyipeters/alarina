import type { VendorCategory } from '../lib/vendors.ts'

// What the planning API returns (be/src/routes/planning.ts, bookings.ts, budget.ts). Amounts in kobo.

/** Who someone is to a wedding: the couple, the main planner or a co-planner. */
export type PlanningRole = 'couple' | 'main' | 'co'

export type TeamStatus = 'considering' | 'enquired' | 'booked' | 'cancelled'

export type TeamMember = {
  id: string
  vendorId: string | null
  vendorSlug: string | null
  name: string
  category: VendorCategory
  phone: string | null
  email: string | null
  status: TeamStatus
  notes: string
  bookable: boolean
  createdAt: string
}

export type Planner = {
  id: string
  role: 'main' | 'co'
  status: 'invited' | 'active'
  businessName: string | null
  vendorSlug: string | null
  email: string | null
  expired: boolean
}

export type Note = {
  id: string
  authorName: string
  authorRole: PlanningRole
  mine: boolean
  body: string
  teamVendorId: string | null
  budgetItemId: string | null
  createdAt: string
}

export type BookingStatus = 'enquiry' | 'quoted' | 'accepted' | 'cancelled'

export type Booking = {
  id: string
  weddingId: string
  weddingVendorId: string
  vendorId: string
  status: BookingStatus
  packageName: string | null
  messages: { from: 'couple' | 'vendor'; authorName: string; body: string; at: string }[]
  quote: { lines: { name: string; amount: number }[]; total: number; deposit: number | null; validUntil: string | null; note: string | null; at: string } | null
  paid: number
  balance: number
  acceptedAt: string | null
  cancelledAt: string | null
  cancelledBy: 'couple' | 'vendor' | null
  updatedAt: string
  vendorName?: string | null
  category?: VendorCategory | null
  vendorSlug?: string | null
  payable?: boolean
  couple?: { names: string; date: string | null; venueName: string | null }
  payments?: { id: string; amount: number; fee?: number; status?: string; paidAt: string | null }[]
}

export type BudgetCategory = VendorCategory | 'personal'
export type LineStatus = 'unpaid' | 'part_paid' | 'paid'

export type Totals = { cost: number; paid: number; paidInApp: number; paidOffline: number; outstanding: number; overpaid: number }

export type BudgetLine = Totals & {
  id: string
  name: string
  category: BudgetCategory
  status: LineStatus
  weddingVendorId: string | null
  vendorName: string | null
  onAlarina: boolean
  bookingId: string | null
  dueDate: string | null
  overdue: boolean
  notes: string
  offlinePayments: { id: string; amount: number; date: string; note: string; recordedByName: string }[]
}

export type Budget = {
  role: PlanningRole
  canEdit: boolean
  lines: BudgetLine[]
  categories: (Totals & { category: BudgetCategory; count: number })[]
  overall: Totals & { count: number }
}

export type Summary = {
  role: PlanningRole
  wedding: {
    id: string
    names: string
    date: string | null
    startTime: string | null
    venueName: string | null
    venueAddress: string | null
    receptionVenueName: string | null
    events: { name: string; date: string | null; venueName: string | null }[]
  }
  guests: { attending: number; declined: number; total: number }
}

export const ROLE_LABELS: Record<PlanningRole, string> = { couple: 'Couple', main: 'Main planner', co: 'Co-planner' }
export const TEAM_STATUS_LABELS: Record<TeamStatus, string> = {
  considering: 'Considering',
  enquired: 'Enquired',
  booked: 'Booked',
  cancelled: 'Not going ahead',
}
export const LINE_STATUS_LABELS: Record<LineStatus, string> = { unpaid: 'Not paid', part_paid: 'Part paid', paid: 'Paid' }
