import type { Responses } from './types.ts'

/** "Ada’s side", or "Side not set" when the reply didn't come through a partner's link. */
export const sideLabel = (partners: Responses['partners'], userId: string | null) =>
  userId ? `${partners.find((p) => p.userId === userId)?.name ?? 'Partner'}’s side` : 'Side not set'
