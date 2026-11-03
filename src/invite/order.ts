import type { Role } from '../lib/types.ts'

type Pair = { partnerOneName: string | null; partnerTwoName: string | null; partnerOneRole?: Role | null; partnerTwoRole?: Role | null }

/** Whether the couple marked the second partner as the bride (and not both the same). */
const brideIsSecond = (w: Pair) =>
  (w.partnerTwoRole === 'bride' && w.partnerOneRole !== 'bride') ||
  (w.partnerOneRole === 'groom' && w.partnerTwoRole !== 'groom')

// Every answer that belongs to one partner, as [first partner's key, second partner's key].
const PAIRED = [
  ['partnerOneName', 'partnerTwoName'],
  ['partnerOneRole', 'partnerTwoRole'],
  ['partnerOneFamily', 'partnerTwoFamily'],
  ['partnerOneFather', 'partnerTwoFather'],
  ['partnerOneMother', 'partnerTwoMother'],
] as const

const SWAP_LATE: Record<string, string> = {
  partnerOneFather: 'partnerTwoFather',
  partnerTwoFather: 'partnerOneFather',
  partnerOneMother: 'partnerTwoMother',
  partnerTwoMother: 'partnerOneMother',
}

/**
 * The invitation as guests read it: the bride first, with her name and her parents, once the
 * couple has said who the bride is. Otherwise the order they typed. Only for showing; what the
 * couple entered in setup stays as it is.
 */
export function inBrideOrder<T extends Pair>(w: T): T {
  if (!brideIsSecond(w)) return w
  const out: Record<string, unknown> = { ...w }
  for (const [one, two] of PAIRED) {
    if (one in w || two in w) {
      out[one] = (w as Record<string, unknown>)[two] ?? null
      out[two] = (w as Record<string, unknown>)[one] ?? null
    }
  }
  const late = (w as { lateParents?: string[] }).lateParents
  if (late) out.lateParents = late.map((f) => SWAP_LATE[f] ?? f)
  return out as T
}

/** The two names in invitation order, for "Ada & Tunde" lines and initials. */
export const namesInOrder = (w: Pair) => {
  const o = inBrideOrder(w)
  return [o.partnerOneName, o.partnerTwoName] as const
}
