import type { CeremonyType, WeddingFields } from '../lib/types.ts'

/** The choices in setup. */
export const CEREMONY_TYPES: Record<CeremonyType, string> = {
  church: 'Church',
  mosque: 'Mosque',
  registry: 'Registry',
  traditional: 'Traditional',
  other: 'Other',
}

/** What the invitation calls the ceremony. */
const CEREMONY_NAMES: Record<CeremonyType, string> = {
  church: 'Church service',
  mosque: 'Nikkah',
  registry: 'Registry',
  traditional: 'Traditional ceremony',
  other: 'Ceremony',
}

/** The venue field's label and an example, so a church wedding is asked for its church. */
export const VENUE_PROMPTS: Record<CeremonyType | 'none', { label: string; placeholder: string }> = {
  church: { label: 'Church', placeholder: 'St. Leo’s Catholic Church, Ikeja' },
  mosque: { label: 'Mosque', placeholder: 'Lagos Central Mosque' },
  registry: { label: 'Registry', placeholder: 'Ikoyi Marriage Registry' },
  traditional: { label: 'Venue name', placeholder: 'The family house, Ibadan' },
  other: { label: 'Venue name', placeholder: 'Eko Hotel and Suites' },
  none: { label: 'Venue name', placeholder: 'Eko Hotel and Suites' },
}

export type VenueStop = { key: 'ceremony' | 'reception'; label: string | null; name: string; address: string | null; time: string | null }

type Source = Pick<
  WeddingFields,
  'ceremonyType' | 'venueName' | 'venueAddress' | 'startTime' | 'receptionSeparate' | 'receptionVenueName' | 'receptionVenueAddress' | 'receptionTime'
>

/**
 * Where the day happens, in order. One stop when the reception is at the ceremony venue (labelled
 * only if the couple said what kind of ceremony it is), two when it's somewhere else, each with
 * its own time.
 */
export function venueStops(w: Source): VenueStop[] {
  if (!w.venueName) return []
  const ceremony = w.ceremonyType ? CEREMONY_NAMES[w.ceremonyType] : null
  if (!w.receptionSeparate || !w.receptionVenueName) {
    return [{ key: 'ceremony', label: ceremony && `${ceremony} & reception`, name: w.venueName, address: w.venueAddress, time: null }]
  }
  return [
    { key: 'ceremony', label: ceremony ?? 'Ceremony', name: w.venueName, address: w.venueAddress, time: w.startTime },
    { key: 'reception', label: 'Reception', name: w.receptionVenueName, address: w.receptionVenueAddress, time: w.receptionTime },
  ]
}

/** Whether the day's times sit with the venues, so the date block leaves its time out. */
export const timesWithVenues = (w: Source) => venueStops(w).length > 1
