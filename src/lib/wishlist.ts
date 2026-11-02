// Keep these limits in step with be/src/lib/wishlist.ts; the server enforces them.

export const MIN_WISH_PRICE_NAIRA = 500
export const MAX_WISH_PRICE_NAIRA = 2_000_000
// The smallest chip-in in kobo; the last bit of an item can be less so it can always be finished.
export const MIN_CONTRIBUTION = 500_00
