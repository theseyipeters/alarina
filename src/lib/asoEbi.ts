// Keep these limits in step with be/src/lib/asoEbi.ts; the server enforces them.

export const UNITS = ['set', 'yard', 'piece'] as const
export type AsoEbiUnit = (typeof UNITS)[number]

export const MIN_PRICE_NAIRA = 500
export const MAX_PRICE_NAIRA = 250_000
export const MAX_QUANTITY = 20

/** "2 sets", "1 yard". */
export const quantityLabel = (quantity: number, unit: string) => `${quantity} ${quantity === 1 ? unit : `${unit}s`}`
