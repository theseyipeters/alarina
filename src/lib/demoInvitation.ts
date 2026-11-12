import { EMPTY_LOOK, LOOKS, lookDesign, type Design } from '../invite/design.ts'
import { SAMPLE, type DemoValues } from './heroDemo.ts'
import type { InvitationContent } from './types.ts'

/**
 * The landing demo's invitation: the visitor's names and date (else the sample couple), at a
 * made-up venue, in the chosen design (else the current curated look). Never saved or sent.
 */
export function demoInvitation(values: DemoValues, override?: Design): InvitationContent {
  const { template, palette, look } = override ?? values.design ?? lookDesign(LOOKS[values.look]!)
  return {
    template,
    palette,
    look: { ...EMPTY_LOOK, ...look },
    partnerOneName: values.one.trim() || SAMPLE.one,
    partnerTwoName: values.two.trim() || SAMPLE.two,
    partnerOneRole: null,
    partnerTwoRole: null,
    hashtag: null,
    partnerOneFamily: null,
    partnerTwoFamily: null,
    partnerOneFather: null,
    partnerOneMother: null,
    partnerTwoFather: null,
    partnerTwoMother: null,
    lateParents: [],
    date: values.date || SAMPLE.date,
    startTime: '14:00',
    venueName: 'The Garden Hall',
    venueAddress: 'Lagos',
    ceremonyName: null,
    receptionSeparate: false,
    receptionName: null,
    receptionVenueName: null,
    receptionVenueAddress: null,
    receptionTime: null,
    dressNote: null,
    message: null,
    rsvpDeadline: null,
    contactPhoneOne: null,
    contactPhoneTwo: null,
    strictlyByInvitation: false,
    events: [],
  }
}
