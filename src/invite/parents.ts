import type { ParentField, Role, WeddingFields } from '../lib/types.ts'

export type Parent = { field: ParentField; name: string; late: boolean }
export type ParentSide = { partner: string | null; role: Role | null; parents: Parent[] }

export const ROLE_LABELS: Record<Role, string> = { bride: 'Bride', groom: 'Groom' }

/** The two sides in invitation order: each partner's father, then mother. */
export const PARENT_SIDES = [
  { partner: 'partnerOneName', role: 'partnerOneRole', father: 'partnerOneFather', mother: 'partnerOneMother' },
  { partner: 'partnerTwoName', role: 'partnerTwoRole', father: 'partnerTwoFather', mother: 'partnerTwoMother' },
] as const

type Source = Pick<
  WeddingFields,
  'partnerOneName' | 'partnerTwoName' | 'partnerOneRole' | 'partnerTwoRole' | ParentField | 'lateParents'
>

/** "Late Mr Ọlá" typed with the box ticked would read "Late Late", so the typed word goes. */
const withoutLate = (name: string) => name.replace(/^(the\s+)?late\s+/i, '')

/** Each side that has at least one parent named. Empty when no parents are added. */
export function parentSides(w: Source): ParentSide[] {
  const late = new Set(w.lateParents ?? [])
  return PARENT_SIDES.map((side) => ({
    partner: w[side.partner]?.trim() || null,
    role: w[side.role] ?? null,
    parents: [side.father, side.mother].flatMap((field) => {
      const name = w[field]?.trim()
      if (!name) return []
      return [{ field, name: late.has(field) ? withoutLate(name) : name, late: late.has(field) }]
    }),
  })).filter((side) => side.parents.length > 0)
}

/** One line for summaries: "Mr Hassan & Mrs Hassan (Ibukun, bride) · Late Mr Ade (Tosin, groom)". */
export const parentsText = (w: Source) =>
  parentSides(w)
    .map((s) => {
      const whose = [s.partner, s.role].filter(Boolean).join(', ')
      return `${s.parents.map((p) => `${p.late ? 'Late ' : ''}${p.name}`).join(' & ')}${whose ? ` (${whose})` : ''}`
    })
    .join(' · ')
