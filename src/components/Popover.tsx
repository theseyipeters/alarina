import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  /** The control the popover hangs from; clicks on it don't count as "outside". */
  anchor: RefObject<HTMLElement | null>
  open: boolean
  /** Called for a click or tap outside. Escape and keyboard are the owner's to handle. */
  onClose: () => void
  /** Called once the panel has been sized and positioned, when scrolling inside it can first work. */
  onPlaced?: () => void
  /** Make the popover at least as wide as the control. */
  matchWidth?: boolean
  className?: string
  children: ReactNode
  id?: string
  role?: string
  'aria-label'?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

// Invisible until measured. Not `visibility: hidden`, which would stop the first focus from landing.
const UNPLACED: CSSProperties = { position: 'fixed', top: 0, left: 0, opacity: 0 }

const GAP = 4
const MARGIN = 8

/** Where the panel goes: under the control, or above it when there's more room there. */
function measure(control: HTMLElement, panel: HTMLElement, matchWidth: boolean | undefined): CSSProperties {
  const rect = control.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom - GAP - MARGIN
  const above = rect.top - GAP - MARGIN
  const openUp = panel.scrollHeight > below && above > below
  const width = Math.max(rect.width, panel.offsetWidth)
  return {
    position: 'fixed',
    left: Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN)),
    ...(openUp ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
    maxHeight: Math.max(120, openUp ? above : below),
    ...(matchWidth && { minWidth: rect.width }),
  }
}

const sameStyle = (a: CSSProperties, b: CSSProperties) => JSON.stringify(a) === JSON.stringify(b)

/**
 * A panel under (or, when there's no room, above) a control, drawn on top of everything. It lives
 * in <body>, so tables and scrolling cards never clip it, and follows the control as the page moves.
 */
export default function Popover({ anchor, open, onClose, onPlaced, matchWidth, className, children, onKeyDown, ...aria }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>(UNPLACED)

  // Measured again whenever the content changes, since it can change size.
  useLayoutEffect(() => {
    if (!open || !anchor.current || !ref.current) return
    const next = measure(anchor.current, ref.current, matchWidth)
    setStyle((prev) => (sameStyle(prev, next) ? prev : next))
  }, [open, anchor, matchWidth, children])

  useLayoutEffect(() => {
    if (open && style !== UNPLACED) onPlaced?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the panel first gets its place
  }, [open, style === UNPLACED])

  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      const target = e.target as Node
      if (!ref.current?.contains(target) && !anchor.current?.contains(target)) onClose()
    }
    const follow = () => {
      if (!anchor.current || !ref.current) return
      const next = measure(anchor.current, ref.current, matchWidth)
      setStyle((prev) => (sameStyle(prev, next) ? prev : next))
    }
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', follow)
    window.addEventListener('scroll', follow, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', follow)
      window.removeEventListener('scroll', follow, true)
    }
  }, [open, anchor, matchWidth, onClose])

  if (!open) return null
  return createPortal(
    <div ref={ref} className={className ? `popover ${className}` : 'popover'} style={style} onKeyDown={onKeyDown} {...aria}>
      {children}
    </div>,
    document.body,
  )
}
