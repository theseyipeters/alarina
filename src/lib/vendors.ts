// What vendors sell. Keep these ids in step with be/src/lib/vendors.ts.
export const VENDOR_CATEGORIES = {
  planner: { label: 'Planners', one: 'Planner' },
  venue: { label: 'Venues', one: 'Venue' },
  catering: { label: 'Catering', one: 'Caterer' },
  photography: { label: 'Photography', one: 'Photographer' },
  videography: { label: 'Videography', one: 'Videographer' },
  decor: { label: 'Decor & flowers', one: 'Decorator' },
  makeup: { label: 'Makeup & gele', one: 'Makeup artist' },
  fashion: { label: 'Fashion & tailoring', one: 'Fashion designer' },
  music: { label: 'Music & DJs', one: 'Music' },
  mc: { label: 'MCs & hosts', one: 'MC' },
  cake: { label: 'Cakes & desserts', one: 'Cake maker' },
  rentals: { label: 'Rentals', one: 'Rentals' },
  transport: { label: 'Transport', one: 'Transport' },
  gifts: { label: 'Gifts & souvenirs', one: 'Gift shop' },
  other: { label: 'Other services', one: 'Vendor' },
} as const

export type VendorCategory = keyof typeof VENDOR_CATEGORIES
export const CATEGORY_IDS = Object.keys(VENDOR_CATEGORIES) as VendorCategory[]

export type VendorStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'

export const STATUS_LABELS: Record<VendorStatus, string> = {
  draft: 'Draft',
  pending: 'Waiting for review',
  approved: 'Live',
  rejected: 'Needs changes',
  suspended: 'Suspended',
}

// Whole naira, as the API takes them.
export const MIN_PRICE_NAIRA = 500
export const MAX_PRICE_NAIRA = 50_000_000
