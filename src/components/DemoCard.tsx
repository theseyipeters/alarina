import { useMemo } from 'react'
import InvitationCard from '../invite/InvitationCard.tsx'
import { inviteAttrs, type Design } from '../invite/design.ts'
import { demoInvitation } from '../lib/demoInvitation.ts'
import type { DemoValues } from '../lib/heroDemo.ts'
import '../invite/styles.ts'

/** The real invitation, rebuilt as the visitor types. Loaded on its own so the page's first paint stays light. */
export default function DemoCard({
  values,
  idPrefix = 'hero-demo',
  design,
}: {
  values: DemoValues
  idPrefix?: string
  /** Show this design instead of the visitor's current one (the gallery's cards). */
  design?: Design
}) {
  const invitation = useMemo(() => demoInvitation(values, design), [values, design])
  return (
    <div className="inv inv--preview" {...inviteAttrs(invitation)} inert>
      <InvitationCard invitation={invitation} idPrefix={idPrefix} />
    </div>
  )
}
