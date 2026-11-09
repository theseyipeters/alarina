import type { VendorCategory, VendorStatus } from './vendors.ts'
import type { InvitationLook, Palette, Template } from '../invite/design.ts'
import type { AsoEbiUnit } from './asoEbi.ts'

export type User = {
  id: string
  name: string
  email: string
  kind: 'couple' | 'vendor'
  tourCompletedAt: string | null
  /** The tour version they last finished; below currentTourVersion, they're shown what's new. */
  tourVersion: number
  currentTourVersion: number
}

export type Couple = {
  id: string
  partner: { name: string; email: string } | null
  pendingInvite: { email: string | null; expiresAt: string } | null
}

/** A vendor's own account, as every vendor page needs it. */
export type VendorSummary = {
  id: string
  slug: string
  businessName: string
  category: VendorCategory
  status: VendorStatus
  reviewNote: string | null
  hasPayout: boolean
}

export type CoupleSession = { user: User; couple: Couple; vendor: null }
export type VendorSession = { user: User; couple: null; vendor: VendorSummary }
/** What sign-in, sign-up and /auth/me return: a couple's or a vendor's session. */
export type Session = CoupleSession | VendorSession

export type WeddingEvent = {
  id: string
  name: string
  date: string | null
  startTime: string | null
  venueName: string | null
  venueAddress: string | null
}

export type Role = 'bride' | 'groom'

export type ParentField = 'partnerOneFather' | 'partnerOneMother' | 'partnerTwoFather' | 'partnerTwoMother'

/** Answers collected by the guided setup. Dates are YYYY-MM-DD and times HH:mm, Nigerian local time. */
export type WeddingFields = {
  partnerOneName: string | null
  partnerTwoName: string | null
  /** Bride or groom, for captions like "Parents of the Bride". Optional. */
  partnerOneRole: Role | null
  partnerTwoRole: Role | null
  /** The wedding hashtag without its "#", e.g. "OlaAndEni2027". */
  hashtag: string | null
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
  /** The couple's name for the event at the venue above; startTime is when it starts. */
  ceremonyName: string | null
  /** A reception somewhere else the same day, with its own name, venue and time. */
  receptionSeparate: boolean
  receptionName: string | null
  receptionVenueName: string | null
  receptionVenueAddress: string | null
  receptionTime: string | null
  dressNote: string | null
  message: string | null
  rsvpDeadline: string | null
  /** How many people one reply can bring, the guest included. 1: everyone replies for themselves. */
  maxPartySize: number
  /** Numbers guests can call, as the couple typed them. */
  contactPhoneOne: string | null
  contactPhoneTwo: string | null
  /** Whether the card ends with "Strictly by Invitation". */
  strictlyByInvitation: boolean
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
  /** From the gift shop: the shop that sells and delivers it (the couple's view only). */
  vendorName?: string | null
  /** From the gift shop (guests' view). */
  fromShop?: boolean
}

export type AsoEbiItem = {
  id: string
  name: string
  description: string
  imageId: string | null
  unit: AsoEbiUnit
  price: number
}

export type Rsvp = {
  name: string
  email: string
  phone: string
  attending: boolean
  partySize: number
  rejected: boolean
  rejectionNote: string | null
  updatedAt: string
}

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
  rejected: boolean
  rejectionNote: string | null
  sideUserId: string | null
  sideSource: 'link' | 'couple' | null
  editLinkActive: boolean
  createdAt: string
  updatedAt: string
}

/** `people` adds up party sizes: a reply can bring several. */
export type Counts = { total: number; attending: number; declined: number; rejected: number; people?: number }

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
  /** `received` reached the couple's account; `toShops` was paid to gift shops for their items. */
  totals: { received: number; toShops?: number; count: number }
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

/* ── Vendors ──────────────────────────────────────────────────────── */

export type VendorPackage = { id: string; name: string; description: string; price: number }
export type VendorProduct = { id: string; name: string; description: string; imageId: string | null; price: number; active: boolean }

/** A vendor's whole listing, as they edit it. Prices are in kobo. */
export type VendorListing = VendorSummary & {
  description: string
  city: string
  phone: string
  email: string
  website: string
  instagram: string
  coverImageId: string | null
  gallery: string[]
  priceFrom: number | null
  packages: VendorPackage[]
  products: VendorProduct[]
  submittedAt: string | null
  reviewedAt: string | null
  payout: { bankName: string; accountName: string; accountLast4: string } | null
}
