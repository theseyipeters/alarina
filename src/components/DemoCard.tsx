import { useMemo } from 'react'
import InvitationCard from '../invite/InvitationCard.tsx'
import { EMPTY_LOOK, inviteAttrs, LOOKS, lookDesign } from '../invite/design.ts'
import type { InvitationContent } from '../lib/types.ts'
import { SAMPLE, type DemoValues } from '../lib/heroDemo.ts'
import '../invite/styles.ts'

function content(values: DemoValues): InvitationContent {
  const { template, palette, look } = lookDesign(LOOKS[values.look]!)
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

/** The real invitation, rebuilt as the visitor types. Loaded on its own so the page's first paint stays light. */
export default function DemoCard({ values, idPrefix = 'hero-demo' }: { values: DemoValues; idPrefix?: string }) {
  const invitation = useMemo(() => content(values), [values])
  return (
    <div className="inv inv--preview" {...inviteAttrs(invitation)} inert>
      <InvitationCard invitation={invitation} idPrefix={idPrefix} />
    </div>
  )
}
