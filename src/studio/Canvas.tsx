import { useEffect, useRef, useState, type CSSProperties } from 'react'
import EnvelopeIntro, { OPEN_MS } from '../invite/EnvelopeIntro.tsx'
import InvitationCard from '../invite/InvitationCard.tsx'
import { inviteAttrs } from '../invite/design.ts'
import RsvpForm from '../invite/RsvpForm.tsx'
import type { InvitationContent } from '../lib/types.ts'
import { DesktopIcon, PhoneIcon, TabletIcon } from './icons.tsx'

type View = 'card' | 'page' | 'envelope'
type Device = 'phone' | 'tablet' | 'desktop'

const VIEWS: { id: View; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'page', label: 'Full page' },
  { id: 'envelope', label: 'Envelope' },
]

const DEVICES = [
  { id: 'phone', label: 'Phone', width: 390, Icon: PhoneIcon },
  { id: 'tablet', label: 'Tablet', width: 768, Icon: TabletIcon },
  { id: 'desktop', label: 'Desktop', width: 1200, Icon: DesktopIcon },
] as const

const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5]
const STAGE_PADDING = 64

/** The live preview: the couple's invitation as guests will see it, at any screen size. */
export default function Canvas({ invitation }: { invitation: InvitationContent }) {
  const [view, setView] = useState<View>('card')
  const [device, setDevice] = useState<Device>('phone')
  const [zoom, setZoom] = useState<number | 'fit'>('fit')
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(0)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry!.contentRect.width))
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const width = DEVICES.find((d) => d.id === device)!.width
  const fit = stageWidth ? Math.min(1, (stageWidth - STAGE_PADDING) / width) : 1
  const scale = zoom === 'fit' ? fit : zoom
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? ZOOMS.find((z) => z > scale + 0.001) : ZOOMS.findLast((z) => z < scale - 0.001)
    if (next) setZoom(next)
  }

  const attrs = inviteAttrs(invitation)
  const monogram = [invitation.partnerOneName, invitation.partnerTwoName]
    .map((n) => n?.normalize('NFC').trim()[0] ?? '')
    .join('')

  return (
    <section className="studio-canvas" aria-label="Preview">
      <div className="studio-toolbar">
        <div className="studio-seg" role="group" aria-label="View">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>

        <div className="studio-seg" role="group" aria-label="Screen size">
          {DEVICES.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={device === id} onClick={() => setDevice(id)} title={label}>
              <Icon />
              <span className="visually-hidden">{label}</span>
            </button>
          ))}
        </div>

        <div className="studio-zoom" role="group" aria-label="Zoom">
          <button type="button" onClick={() => step(-1)} disabled={scale <= ZOOMS[0]!}>
            <span aria-hidden="true">−</span>
            <span className="visually-hidden">Zoom out</span>
          </button>
          <output aria-live="polite">{Math.round(scale * 100)}%</output>
          <button type="button" onClick={() => step(1)} disabled={scale >= ZOOMS.at(-1)!}>
            <span aria-hidden="true">+</span>
            <span className="visually-hidden">Zoom in</span>
          </button>
          <button type="button" aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>
            Fit
          </button>
        </div>
      </div>

      <div className="studio-stage" ref={stageRef}>
        <div
          className={`studio-frame studio-frame--${device}`}
          style={{ width, zoom: scale } as CSSProperties}
        >
          {view === 'card' && (
            <div className="inv inv--preview" {...attrs} inert>
              <InvitationCard invitation={invitation} />
            </div>
          )}

          {view === 'page' && (
            <div className="inv inv--page inv--preview studio-page" {...attrs} inert>
              <span className="inv-monogram" aria-hidden="true">{monogram}</span>
              <div className="inv-column">
                <InvitationCard invitation={invitation} />
                <section className="inv-panel" aria-label="RSVP preview">
                  <h2>RSVP</h2>
                  <RsvpForm submitLabel="Send reply" busyLabel="Sending…" disabled onSubmit={async () => {}} />
                </section>
              </div>
            </div>
          )}

          {view === 'envelope' && <EnvelopePreview invitation={invitation} attrs={attrs} />}
        </div>
      </div>
    </section>
  )
}

/** The guest's opening envelope. Opening plays the real animation, then it reseals for another go. */
function EnvelopePreview({ invitation, attrs }: { invitation: InvitationContent; attrs: ReturnType<typeof inviteAttrs> }) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (!opening) return
    const timer = setTimeout(() => setOpening(false), OPEN_MS + 900)
    return () => clearTimeout(timer)
  }, [opening])

  return (
    <div className="inv inv--preview studio-envelope" {...attrs}>
      <EnvelopeIntro invitation={invitation} opening={opening} onOpen={() => setOpening(true)} />
    </div>
  )
}
