import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './Tour.css'

/** One stop. Without a target it's a centred card (an intro); targets that aren't on the page are skipped. */
export type TourStep = { target?: string; title: string; text: string }

type Rect = { top: number; left: number; width: number; height: number }

const PAD = 8 // space between the element and the spotlight's edge
const GAP = 14 // space between the spotlight and the card
const EDGE = 16 // closest the card gets to the viewport edge
const NARROW = '(max-width: 40rem)'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const find = (step: TourStep | undefined) => (step?.target ? document.querySelector(step.target) : null)

/**
 * A guided tour. A modal dialog dims the page, cuts a spotlight around one element at a time and
 * explains it in a card beside it (docked at the bottom on phones). Being modal, it holds focus
 * and keeps the page inert until it ends. Skip, Done and Escape all call onClose, once.
 */
export default function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  // Worked out once the page around the tour is on screen, and fixed from then on, so the step
  // count doesn't change part-way through.
  const [stops, setStops] = useState<TourStep[]>([])
  const [index, setIndex] = useState(0)
  const [spot, setSpot] = useState<Rect | null>(null)
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null)
  const step = stops[index]
  const last = index === stops.length - 1

  useEffect(() => {
    const frame = requestAnimationFrame(() => setStops(steps.filter((s) => !s.target || find(s))))
    return () => cancelAnimationFrame(frame)
    // Only on open: later changes to `steps` (a partner joining mid-tour) shouldn't restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!step || dialog?.open) return
    dialog?.showModal()
  }, [step])

  useEffect(() => {
    const dialog = dialogRef.current
    return () => dialog?.close()
  }, [])

  const measure = useCallback(() => {
    const r = find(step)?.getBoundingClientRect()
    setSpot(r ? { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 } : null)
  }, [step])

  // Bring each stop into view (near the top on phones, where the card covers the bottom), then
  // keep the spotlight on it while the page scrolls or resizes.
  useEffect(() => {
    const r = find(step)?.getBoundingClientRect()
    if (r) {
      const nearTop = window.matchMedia(NARROW).matches || r.height > window.innerHeight * 0.5
      const y = window.scrollY + r.top - (nearTop ? 96 : (window.innerHeight - r.height) / 2)
      window.scrollTo({ top: Math.max(0, y), behavior: reducedMotion() ? 'auto' : 'smooth' })
    }
    const frame = requestAnimationFrame(measure)
    primaryRef.current?.focus()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [step, measure])

  // Place the card below the spotlight, else above, else beside it; clamp it inside the viewport.
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !spot || window.matchMedia(NARROW).matches) {
      setCardPos(null)
      return
    }
    const { width, height } = card.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const clampLeft = (x: number) => Math.min(Math.max(EDGE, x), vw - width - EDGE)
    const clampTop = (y: number) => Math.min(Math.max(EDGE, y), vh - height - EDGE)
    const below = spot.top + spot.height + GAP
    const above = spot.top - GAP - height
    const right = spot.left + spot.width + GAP
    const left = spot.left - GAP - width

    if (below + height <= vh - EDGE) setCardPos({ top: below, left: clampLeft(spot.left) })
    else if (above >= EDGE) setCardPos({ top: above, left: clampLeft(spot.left) })
    else if (right + width <= vw - EDGE) setCardPos({ top: clampTop(spot.top), left: right })
    else if (left >= EDGE) setCardPos({ top: clampTop(spot.top), left })
    else setCardPos({ top: vh - height - EDGE, left: clampLeft(spot.left) })
  }, [spot, index])

  const placement = !spot ? 'center' : window.matchMedia(NARROW).matches ? 'dock' : 'float'

  return (
    <dialog
      ref={dialogRef}
      className="tour"
      aria-labelledby="tour-title"
      aria-describedby="tour-text"
      onCancel={(e) => {
        // Escape: end the tour ourselves rather than relying on the dialog's close event.
        e.preventDefault()
        onClose()
      }}
    >
      {/* Keyed, so the spotlight is a new element rather than the dim layer sliding in from the corner. */}
      {spot ? (
        <div key="spot" className="tour-spot" style={spot} aria-hidden="true" />
      ) : (
        <div key="dim" className="tour-dim" aria-hidden="true" />
      )}

      {step && (
        <div
          ref={cardRef}
          className="tour-card"
          data-placement={placement}
          // Hidden for the one frame between knowing the spotlight and placing the card beside it.
          style={placement === 'float' ? (cardPos ?? { visibility: 'hidden' }) : undefined}
        >
          {stops.length > 1 && (
            <p className="eyebrow">
              {index + 1} of {stops.length}
            </p>
          )}
          <h2 id="tour-title" className="tour-title">{step.title}</h2>
          <p id="tour-text" className="tour-text">{step.text}</p>
          {/* Announce each new stop: focus stays on the button, which screen readers would otherwise just repeat. */}
          <p className="visually-hidden" aria-live="polite">
            {index > 0 && `${step.title}. ${step.text}`}
          </p>

          <div className="tour-actions">
            {!last && (
              <button type="button" className="link-button tour-skip" onClick={onClose}>
                Skip tour
              </button>
            )}
            {index > 0 && (
              <button type="button" className="btn btn--secondary" onClick={() => setIndex(index - 1)}>
                Back
              </button>
            )}
            <button ref={primaryRef} type="button" className="btn" onClick={last ? onClose : () => setIndex(index + 1)}>
              {last ? 'Done' : index === 0 && !stops[0]!.target ? 'Show me around' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
