// Amounts from the API are in kobo. Paystack's fee is worked out on the server (be/src/lib/fees.ts)
// and included in the total guests see on Paystack's own checkout, not shown here.

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
const nairaWhole = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

/** 1025381 → "₦10,253.81"; whole amounts drop the kobo ("₦10,000"). */
export const formatNaira = (kobo: number) => (kobo % 100 === 0 ? nairaWhole : naira).format(kobo / 100)

export const MIN_GIFT_NAIRA = 1_000
export const MAX_GIFT_NAIRA = 5_000_000

/** "1250000" → "1,250,000". Works on the digits as text, so long amounts never lose precision. */
export const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/**
 * A kobo amount as whole naira for an amount field's value: "125000" for 12500000. Rounds down,
 * so a suggested payment never goes over what's owed.
 */
export const nairaInput = (kobo: number | null | undefined) => (kobo == null ? '' : String(Math.floor(kobo / 100)))
