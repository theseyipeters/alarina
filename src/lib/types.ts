import type { Palette, Template } from '../invite/design.ts'

export type User = { id: string; name: string; email: string }

export type Couple = {
  id: string
  partner: { name: string; email: string } | null
  pendingInvite: { email: string | null; expiresAt: string } | null
}

export type Session = { user: User; couple: Couple }

export type WeddingEvent = {
  id: string
  name: string
  date: string | null
  startTime: string | null
  venueName: string | null
  venueAddress: string | null
}

/** Answers collected by the guided setup. Dates are YYYY-MM-DD and times HH:mm, Nigerian local time. */
export type WeddingFields = {
  partnerOneName: string | null
  partnerTwoName: string | null
  partnerOneFamily: string | null
  partnerTwoFamily: string | null
  date: string | null
  startTime: string | null
  venueName: string | null
  venueAddress: string | null
  dressNote: string | null
  message: string | null
  rsvpDeadline: string | null
  events: WeddingEvent[]
}

export type InvitationDesign = { template: Template; palette: Palette }

/** What guests see: the answers plus the chosen design. */
export type InvitationContent = WeddingFields & InvitationDesign

export type PublicInvitation = InvitationContent & {
  slug: string
  rsvpOpen: boolean
  rsvpClosedReason: 'deadline' | 'past' | null
  giftsEnabled: boolean
}

export type Rsvp = { name: string; email: string; phone: string; attending: boolean; updatedAt: string }

export type Wedding = InvitationContent & {
  id: string
  slug: string | null
  status: 'draft' | 'published'
  checkpoint: number
  setupCompletedAt: string | null
  publishedAt: string | null
}

/** A guest's reply as the couple sees it, with contact details and side. */
export type Response = {
  id: string
  name: string
  email: string
  phone: string
  attending: boolean
  sideUserId: string | null
  sideSource: 'link' | 'couple' | null
  editLinkActive: boolean
  createdAt: string
  updatedAt: string
}

export type Counts = { total: number; attending: number; declined: number }

export type Responses = {
  partners: { userId: string; name: string }[]
  summary: Counts & { bySide: (Counts & { userId: string | null })[] }
  rsvps: Response[]
}

export type ShareLinks = {
  generalLink: string | null
  links: { userId: string; name: string; isYou: boolean; link: string | null }[]
}

export type GiftStatus = 'pending' | 'success' | 'failed' | 'abandoned'

export type GiftsOverview = {
  configured: boolean
  feesConfirmed: boolean
  enabled: boolean
  payout: { bankName: string; accountName: string; accountLast4: string } | null
  totals: { received: number; count: number; pending: number }
  contributions: {
    id: string
    guestName: string
    guestEmail: string
    amount: number
    status: GiftStatus
    createdAt: string
    paidAt: string | null
  }[]
}
