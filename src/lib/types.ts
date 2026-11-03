import type { InvitationLook, Palette, Template } from '../invite/design.ts'
import type { AsoEbiUnit } from './asoEbi.ts'

export type User = { id: string; name: string; email: string; tourCompletedAt: string | null }

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

export type ParentField = 'partnerOneFather' | 'partnerOneMother' | 'partnerTwoFather' | 'partnerTwoMother'

/** Answers collected by the guided setup. Dates are YYYY-MM-DD and times HH:mm, Nigerian local time. */
export type WeddingFields = {
  partnerOneName: string | null
  partnerTwoName: string | null
  partnerOneFamily: string | null
  partnerTwoFamily: string | null
  partnerOneFather: string | null
  partnerOneMother: string | null
  partnerTwoFather: string | null
  partnerTwoMother: string | null
  /** Which of the four parents have passed away. */
  lateParents: ParentField[]
  date: string | null
  startTime: string | null
  venueName: string | null
  venueAddress: string | null
  dressNote: string | null
  message: string | null
  rsvpDeadline: string | null
  events: WeddingEvent[]
}

export type InvitationDesign = { template: Template; palette: Palette; look: InvitationLook }

/** What guests see: the answers plus the chosen design. */
export type InvitationContent = WeddingFields & InvitationDesign

export type PublicInvitation = InvitationContent & {
  slug: string
  rsvpOpen: boolean
  rsvpClosedReason: 'deadline' | 'past' | null
  giftsEnabled: boolean
  /** Items guests can buy; empty when the couple isn't offering aso-ebi. */
  asoEbi: AsoEbiItem[]
  /** The couple's wishlist; empty when they aren't sharing one. `funded` is kobo paid so far. */
  wishlist: WishlistItem[]
}

export type WishlistItem = {
  id: string
  name: string
  description: string
  imageId: string | null
  price: number
  funded: number
}

export type AsoEbiItem = {
  id: string
  name: string
  description: string
  imageId: string | null
  unit: AsoEbiUnit
  price: number
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

export type AsoEbiOverview = {
  configured: boolean
  feesConfirmed: boolean
  enabled: boolean
  hasPayout: boolean
  items: (AsoEbiItem & { sold: number })[]
  totals: { received: number; count: number }
  orders: {
    id: string
    guestName: string
    guestEmail: string
    phone: string
    itemName: string
    unit: string
    quantity: number
    amount: number
    status: GiftStatus
    createdAt: string
    paidAt: string | null
  }[]
}

export type WishlistOverview = {
  configured: boolean
  feesConfirmed: boolean
  enabled: boolean
  hasPayout: boolean
  items: WishlistItem[]
  totals: { received: number; count: number }
  gifts: {
    id: string
    guestName: string
    guestEmail: string
    itemName: string
    amount: number
    status: GiftStatus
    createdAt: string
    paidAt: string | null
  }[]
}
