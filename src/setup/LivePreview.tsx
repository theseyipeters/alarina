import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import InvitationCard, { type InvitationPart } from '../invite/InvitationCard.tsx'
import type { Palette, Template } from '../invite/design.ts'
import '../invite/styles.ts'
import type { WeddingFields } from '../lib/types.ts'
import type { StepId } from './steps.ts'

const STEP_PART: Partial<Record<StepId, InvitationPart>> = {
  names: 'names',
  families: 'families',
  date: 'when',
  time: 'when',
  venue: 'where',
  dress: 'dress',
  message: 'message',
  rsvp: 'rsvp',
  events: 'events',
}

type Props = { values: WeddingFields; template: Template; palette: Palette; step: StepId }

/**
 * The invitation, building itself beside the wizard. Empty answers show a gentle stand-in for
 * the question being asked, and that part of the card is highlighted. Decorative: the review
 * step lists every answer for screen-reader users.
 */
export default function LivePreview({ values, template, palette, step }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const highlight = STEP_PART[step] ?? null

  // Bring the highlighted part into view inside the preview panel.
  useEffect(() => {
    const panel = scrollRef.current
    const active = panel?.querySelector<HTMLElement>('[data-active]')
    if (panel && active) panel.scrollTo({ top: Math.max(active.offsetTop - 96, 0), behavior: 'smooth' })
  }, [highlight])

  const filled = (value: string | null | undefined, standIn: string, forStep: StepId) =>
    value?.trim() ? value : step === forStep ? standIn : value ?? null

  const invitation = {
    ...values,
    template,
    palette,
    partnerOneName: values.partnerOneName?.trim() || 'Your name',
    partnerTwoName: values.partnerTwoName?.trim() || 'Your partner',
    partnerOneFamily: filled(values.partnerOneFamily, 'Your family', 'families'),
    partnerTwoFamily: filled(values.partnerTwoFamily, 'Your partner’s family', 'families'),
    venueName: filled(values.venueName, 'Your venue', 'venue'),
    dressNote: filled(values.dressNote, 'Your dress code', 'dress'),
    message: filled(values.message, 'A few words for your guests', 'message'),
    events:
      step === 'events' && !values.events.some((e) => e.name.trim())
        ? [{ id: 'stand-in', name: 'Your other events', date: null, startTime: null, venueName: null, venueAddress: null }]
        : values.events,
  }

  return (
    <aside className="live-preview" aria-label="Invitation preview">
      <div className="live-preview-head">
        <span className="live-dot" aria-hidden="true" />
        <span>Live preview</span>
        <Link to="/app/design">Change design</Link>
      </div>
      <div className="live-preview-frame" ref={scrollRef}>
        <div className="inv inv--preview inv--live" data-palette={palette} data-template={template} inert>
          <InvitationCard invitation={invitation} highlight={highlight} />
        </div>
      </div>
    </aside>
  )
}
