import { useMemo, useRef, useState } from 'react'
import EnvelopeIntro, { OPEN_MS } from '../invite/EnvelopeIntro.tsx'
import InvitationCard from '../invite/InvitationCard.tsx'
import { inviteAttrs } from '../invite/design.ts'
import { namesInOrder } from '../invite/order.ts'
import RsvpForm from '../invite/RsvpForm.tsx'
import '../invite/styles.ts'
import { demoInvitation } from '../lib/demoInvitation.ts'
import { coupleNames, daysUntil } from '../lib/format.ts'
import type { DemoValues } from '../lib/heroDemo.ts'
import './GuestTry.css'

type Stage = 'sealed' | 'opening' | 'open' | 'replied'

// Prefilled with obvious examples, so nobody types real contact details into a demo.
const EXAMPLE = { email: 'guest@example.com', phone: '0801 234 5678' }

const STEPS = ['Open the envelope', 'Read the invitation', 'Reply in a tap']

/**
 * "Try it as a guest": the real guest experience (sealed envelope, invitation, RSVP form) in a
 * phone the visitor can use, with their names and design from the hero. It's a sandbox:
 * nothing is sent or saved, and the email and phone come prefilled with examples. A checklist
 * beside it ticks off as they go. Loaded on its own, with the invitation styles.
 */
export default function GuestTry({ values }: { values: DemoValues }) {
  const invitation = useMemo(() => demoInvitation(values), [values])
  const [stage, setStage] = useState<Stage>('sealed')
  const [read, setRead] = useState(false)
  const [reply, setReply] = useState<{ name: string; attending: boolean } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const names = coupleNames(...namesInOrder(invitation))
  const monogram = namesInOrder(invitation)
    .map((n) => n?.normalize('NFC').trim()[0] ?? '')
    .join('')
  const days = invitation.date ? daysUntil(invitation.date) : null

  const done = [stage === 'open' || stage === 'replied', read || stage === 'replied', stage === 'replied']

  function open() {
    setStage('opening')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => setStage('open'), still ? 0 : OPEN_MS)
  }

  function onScroll() {
    const el = scrollRef.current
    if (el && !read && el.scrollTop > el.clientHeight * 0.4) setRead(true)
  }

  function restart() {
    setStage('sealed')
    setRead(false)
    setReply(null)
    setNote(null)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const extra = (what: string) => () => setNote(`For real guests, this ${what}. Here it’s just a demo.`)

  return (
    <section className="landing-section gt" aria-labelledby="gt-title">
      <div className="gt-grid">
        <div className="gt-copy">
          <p className="gt-eyebrow">For your guests</p>
          <h2 id="gt-title">Try it as a guest</h2>
          <p className="muted gt-lead">
            This is what your aunties, uncles and old school friends will see. Open it, read it and reply, right here.
          </p>
          <ol className="gt-steps">
            {STEPS.map((step, i) => (
              <li key={step} className={done[i] ? 'is-done' : undefined}>
                <span className="gt-tick" aria-hidden="true" />
                {step}
                <span className="visually-hidden">{done[i] ? ' (done)' : ''}</span>
              </li>
            ))}
          </ol>
          <p className="gt-safe">Nothing you do here is sent or saved.</p>
          {stage !== 'sealed' && (
            <button type="button" className="btn btn--secondary" onClick={restart}>Start again</button>
          )}
        </div>

        <div className="gt-device">
          <div className="st-phone gt-phone">
            <span className="st-island" aria-hidden="true" />
            <div className="st-screen gt-screen">
              <div ref={scrollRef} className="gt-scroll" onScroll={onScroll}>
                <div className="inv inv--page gt-inv" {...inviteAttrs(invitation)}>
                  <span className="gt-bar" aria-hidden="true" />
                  {stage === 'sealed' || stage === 'opening' ? (
                    <EnvelopeIntro invitation={invitation} opening={stage === 'opening'} onOpen={open} />
                  ) : (
                    <>
                      <span className="inv-monogram" aria-hidden="true">{monogram}</span>
                      <div className="inv-column inv-reveal">
                        <InvitationCard invitation={invitation} idPrefix="guest-try" />
                        <section className="plan" aria-label="Plan your day">
                          {days !== null && days > 0 && <p className="plan-countdown">In {days} days</p>}
                          <p className="plan-label">Add it to your calendar</p>
                          <div className="actions plan-actions">
                            <button type="button" className="btn btn--secondary" onClick={extra('saves the day to their calendar')}>Calendar</button>
                            <button type="button" className="btn btn--secondary" onClick={extra('opens directions to the venue')}>Directions</button>
                          </div>
                          {note && <p className="gt-note" role="status">{note}</p>}
                        </section>
                        {stage === 'replied' && reply ? (
                          <section className="inv-panel rsvp-done" role="status" aria-label="Reply sent">
                            <svg className="rsvp-check" viewBox="0 0 52 52" aria-hidden="true">
                              <circle cx="26" cy="26" r="24" />
                              <path d={reply.attending ? 'M15 27l7 7 15-16' : 'M18 18l16 16M34 18L18 34'} />
                            </svg>
                            <p className="gt-done-title">
                              {reply.attending ? 'We’ve received your reply' : `Thank you, ${reply.name}`}
                            </p>
                            <p>
                              {reply.attending
                                ? `Thank you, ${reply.name}. ${names} will see your reply straight away.`
                                : `${names} will miss you. Thanks for letting them know.`}
                            </p>
                            <p className="muted gt-done-more">
                              Real guests also get a private link to change their reply, and can send a gift if you
                              turn gifts on.
                            </p>
                          </section>
                        ) : (
                          <section className="inv-panel" aria-label="RSVP">
                            <p className="gt-rsvp-title">RSVP</p>
                            <RsvpForm
                              initial={EXAMPLE}
                              submitLabel="Send reply"
                              busyLabel="Sending…"
                              onSubmit={async (v) => {
                                setReply({ name: v.name.trim().split(/\s+/)[0] || 'friend', attending: v.attending })
                                setStage('replied')
                              }}
                            />
                          </section>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {stage === 'sealed' && <span className="gt-tap" aria-hidden="true">Tap to open</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
