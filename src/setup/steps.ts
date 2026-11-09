import type { WeddingFields } from '../lib/types.ts'

export type StepId = 'names' | 'families' | 'date' | 'ceremony' | 'reception' | 'dress' | 'message' | 'rsvp' | 'events' | 'finish'

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'names', label: 'Your names' },
  { id: 'families', label: 'Families' },
  { id: 'date', label: 'Date' },
  { id: 'ceremony', label: 'Ceremony' },
  { id: 'reception', label: 'Reception' },
  { id: 'dress', label: 'Dress code' },
  { id: 'message', label: 'Message' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'events', label: 'Other days' },
  { id: 'finish', label: 'Review' },
]

export const stepIndex = (id: string | undefined) => STEPS.findIndex((s) => s.id === id)

/** Needed before the invitation can be published, and the step where each one is answered. */
export const REQUIRED: { field: keyof WeddingFields; label: string; step: StepId }[] = [
  { field: 'partnerOneName', label: 'First partner’s name', step: 'names' },
  { field: 'partnerTwoName', label: 'Second partner’s name', step: 'names' },
  { field: 'date', label: 'Wedding date', step: 'date' },
  { field: 'startTime', label: 'Ceremony start time', step: 'ceremony' },
  { field: 'venueName', label: 'Ceremony venue', step: 'ceremony' },
]

/** Where to send the couple to fix a field the server rejected on publish. */
export const FIELD_STEP: Partial<Record<string, StepId>> = {
  ...Object.fromEntries(REQUIRED.map((r) => [r.field, r.step])),
  rsvpDeadline: 'rsvp',
  contactPhoneOne: 'rsvp',
  contactPhoneTwo: 'rsvp',
  receptionVenueName: 'reception',
  ceremonyName: 'ceremony',
  receptionName: 'reception',
}

/** The answers each step owns. Continue always saves these, so prefilled values are stored too. */
export const STEP_FIELDS: Record<StepId, (keyof WeddingFields)[]> = {
  names: ['partnerOneName', 'partnerTwoName', 'hashtag'],
  families: ['partnerOneRole', 'partnerTwoRole', 'partnerOneFather', 'partnerOneMother', 'partnerTwoFather', 'partnerTwoMother', 'lateParents', 'partnerOneFamily', 'partnerTwoFamily'],
  date: ['date'],
  ceremony: ['ceremonyName', 'startTime', 'venueName', 'venueAddress'],
  reception: ['receptionSeparate', 'receptionName', 'receptionVenueName', 'receptionVenueAddress', 'receptionTime'],
  dress: ['dressNote'],
  message: ['message'],
  rsvp: ['rsvpDeadline', 'maxPartySize', 'contactPhoneOne', 'contactPhoneTwo', 'strictlyByInvitation'],
  events: ['events'],
  finish: [],
}
