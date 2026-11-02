import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { addDays, addMonths, dayNumber, longDate, monthTitle, monthWeeks, shortDate, WEEKDAYS } from '../lib/calendar.ts'
import { todayInLagos } from '../lib/format.ts'
import Popover from './Popover.tsx'

type Props = {
  id?: string
  /** YYYY-MM-DD, or '' for no date. */
  value: string
  onChange: (value: string) => void
  /** Earliest and latest dates that can be chosen. */
  min?: string
  max?: string
  /** Offer a Clear button, for dates that are optional. */
  clearable?: boolean
  placeholder?: string
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

/**
 * A date field with a calendar in the app's own style. The days are a grid you can move around
 * with the arrow keys (PageUp and PageDown change month), choose with Enter, and leave with Escape.
 */
export default function DatePicker({ id, value, onChange, min, max, clearable, placeholder = 'Choose a date', disabled, ...aria }: Props) {
  const titleId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const today = todayInLagos()
  const clamp = (d: string) => (min && d < min ? min : max && d > max ? max : d)
  const [open, setOpen] = useState(false)
  // The day the keyboard is on. The month shown follows it.
  const [focus, setFocus] = useState(() => clamp(value || today))
  const [moved, setMoved] = useState(false)

  const blocked = (d: string) => Boolean((min && d < min) || (max && d > max))

  function show() {
    setFocus(clamp(value || today))
    setMoved(false)
    setOpen(true)
  }

  function close(returnFocus = true) {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  function pick(d: string) {
    if (blocked(d)) return
    onChange(d)
    close()
  }

  const go = (d: string) => {
    setMoved(true)
    setFocus(clamp(d))
  }

  // Put the keyboard on the day when the calendar opens, and whenever it moves.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus({ preventScroll: true })
  }, [open, focus, moved])

  function onGridKeyDown(e: KeyboardEvent<HTMLElement>) {
    const steps: Record<string, string> = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      PageUp: addMonths(focus, -1),
      PageDown: addMonths(focus, 1),
    }
    const next = e.shiftKey && e.key === 'PageUp' ? addMonths(focus, -12) : e.shiftKey && e.key === 'PageDown' ? addMonths(focus, 12) : steps[e.key]
    if (next) {
      e.preventDefault()
      go(next)
    }
  }

  function onPanelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    // Keep Tab inside the calendar while it's open; Escape is the way out.
    if (e.key === 'Tab') {
      const items = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"])')]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  const weeks = monthWeeks(focus)

  return (
    <div className="select">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className="select-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close(false) : show())}
        {...aria}
      >
        <span className={value ? 'select-value' : 'select-value select-value--placeholder'}>
          {value ? shortDate(value) : placeholder}
        </span>
        <svg className="select-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3" y="4.5" width="14" height="12" rx="2" />
          <path d="M3 8.5h14M7 3v3M13 3v3" />
        </svg>
      </button>

      <Popover anchor={buttonRef} open={open} onClose={() => close(false)} className="calendar" role="dialog" aria-label="Choose a date">
        <div ref={panelRef} onKeyDown={onPanelKeyDown}>
          <div className="calendar-head">
            <button type="button" className="calendar-nav" aria-label="Previous month" onClick={() => go(addMonths(focus, -1))}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 5l-5 5 5 5" /></svg>
            </button>
            <p id={titleId} className="calendar-title" aria-live="polite">{monthTitle(focus)}</p>
            <button type="button" className="calendar-nav" aria-label="Next month" onClick={() => go(addMonths(focus, 1))}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5" /></svg>
            </button>
          </div>

          <table className="calendar-grid" role="grid" aria-labelledby={titleId} onKeyDown={onGridKeyDown}>
            <thead>
              <tr>
                {WEEKDAYS.map((d) => (
                  <th key={d} scope="col" abbr={d}>{d.slice(0, 2)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, w) => (
                <tr key={w}>
                  {week.map((day, i) =>
                    day ? (
                      <td key={day} role="gridcell" aria-selected={day === value}>
                        <button
                          type="button"
                          data-day={day}
                          className="calendar-day"
                          tabIndex={day === focus ? 0 : -1}
                          disabled={blocked(day)}
                          aria-label={longDate(day)}
                          aria-current={day === today ? 'date' : undefined}
                          aria-pressed={day === value}
                          onClick={() => pick(day)}
                        >
                          {dayNumber(day)}
                        </button>
                      </td>
                    ) : (
                      <td key={`blank-${i}`} aria-hidden="true" />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="calendar-foot">
            {!blocked(today) && (
              <button type="button" className="link-button" onClick={() => pick(today)}>Today</button>
            )}
            {clearable && value && (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  onChange('')
                  close()
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Popover>
    </div>
  )
}
