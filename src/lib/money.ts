// Amounts from the API are in kobo. Paystack's fee is worked out on the server (be/src/lib/fees.ts)
// and included in the total guests see on Paystack's own checkout, not shown here.

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
const nairaWhole = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

/** 1025381 → "₦10,253.81"; whole amounts drop the kobo ("₦10,000"). */
export const formatNaira = (kobo: number) => (kobo % 100 === 0 ? nairaWhole : naira).format(kobo / 100)

export const MIN_GIFT_NAIRA = 1_000
export const MAX_GIFT_NAIRA = 5_000_000
