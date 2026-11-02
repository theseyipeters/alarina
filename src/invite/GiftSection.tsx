import { useState } from 'react'
import type { PublicInvitation } from '../lib/types.ts'
import AsoEbiOffer from './AsoEbiOffer.tsx'
import GiftOffer from './GiftOffer.tsx'

export type GiftKind = 'cash' | 'aso_ebi'

type Props = {
  invitation: PublicInvitation
  names: string
  /** Prefilled from the guest's RSVP when we have it. */
  guest?: { name?: string; email?: string; phone?: string }
  rsvpToken?: string
  /** Which kind to show first, such as the one a failed payment was for. */
  initial?: GiftKind
}

const LABEL: Record<GiftKind, string> = { cash: 'Cash gift', aso_ebi: 'Aso-ebi' }

/** What guests can give, once the couple has switched it on: a cash gift, aso-ebi, or both to choose from. */
export default function GiftSection({ invitation, names, guest, rsvpToken, initial }: Props) {
  const kinds: GiftKind[] = [
    ...(invitation.giftsEnabled ? (['cash'] as const) : []),
    ...(invitation.asoEbi.length > 0 ? (['aso_ebi'] as const) : []),
  ]
  const [chosen, setChosen] = useState<GiftKind | undefined>(initial)
  const kind = chosen && kinds.includes(chosen) ? chosen : kinds[0]
  if (!kind) return null

  return (
    <>
      {kinds.length > 1 && (
        <fieldset className="gift-kinds amount-chips">
          <legend className="visually-hidden">Kind of gift</legend>
          {kinds.map((k) => (
            <label key={k} className="amount-chip">
              <input type="radio" name="gift-kind" checked={k === kind} onChange={() => setChosen(k)} />
              {LABEL[k]}
            </label>
          ))}
        </fieldset>
      )}
      {kind === 'cash' ? (
        <GiftOffer slug={invitation.slug} names={names} guest={guest} rsvpToken={rsvpToken} />
      ) : (
        <AsoEbiOffer slug={invitation.slug} names={names} items={invitation.asoEbi} guest={guest} rsvpToken={rsvpToken} />
      )}
    </>
  )
}
