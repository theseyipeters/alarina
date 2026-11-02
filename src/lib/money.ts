// Amounts from the API are in kobo. Keep the fee maths in step with be/src/lib/fees.ts; the
// server recalculates and charges its own figure, this is only for showing guests the total.

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
const nairaWhole = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

/** 1025381 → "₦10,253.81"; whole amounts drop the kobo ("₦10,000"). */
export const formatNaira = (kobo: number) => (kobo % 100 === 0 ? nairaWhole : naira).format(kobo / 100)

const PERCENT = 0.015
const FLAT = 100_00
const FLAT_WAIVED_UNDER = 2_500_00
const CAP = 2_000_00

export const MIN_GIFT_NAIRA = 1_000
export const MAX_GIFT_NAIRA = 5_000_000

const paystackFee = (charge: number) =>
  Math.min(Math.ceil(charge * PERCENT) + (charge >= FLAT_WAIVED_UNDER ? FLAT : 0), CAP)

/** What the guest pays so the couple receives exactly `net` kobo. */
export function grossUp(net: number) {
  const candidates = [Math.ceil(net / (1 - PERCENT)), Math.ceil((net + FLAT) / (1 - PERCENT)), net + CAP]
  let charge = Math.min(...candidates.filter((c) => c - paystackFee(c) >= net))
  while (charge - 1 - paystackFee(charge - 1) >= net) charge -= 1
  return { charge, fee: charge - net }
}
