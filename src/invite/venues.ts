import type { WeddingFields } from '../lib/types.ts'

export type VenueStop = { key: 'ceremony' | 'reception'; label: string | null; name: string; address: string | null; time: string | null }

type Source = Pick<
  WeddingFields,
  'ceremonyName' | 'venueName' | 'venueAddress' | 'startTime' | 'receptionSeparate' | 'receptionName' | 'receptionVenueName' | 'receptionVenueAddress' | 'receptionTime'
>

/**
 * Where the day happens, in order, under the names the couple gave each event. One stop when the
 * reception is at the ceremony venue, two when it's somewhere else, each with its own time.
 */
export function venueStops(w: Source): VenueStop[] {
  if (!w.venueName) return []
  if (!w.receptionSeparate || !w.receptionVenueName) {
    return [{ key: 'ceremony', label: w.ceremonyName, name: w.venueName, address: w.venueAddress, time: null }]
  }
  return [
    { key: 'ceremony', label: w.ceremonyName, name: w.venueName, address: w.venueAddress, time: w.startTime },
    { key: 'reception', label: w.receptionName, name: w.receptionVenueName, address: w.receptionVenueAddress, time: w.receptionTime },
  ]
}

/** Whether the day's times sit with the venues, so the date block leaves its time out. */
export const timesWithVenues = (w: Source) => venueStops(w).length > 1
