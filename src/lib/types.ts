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
