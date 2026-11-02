import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import Popover from './Popover.tsx'

export type Option = { value: string; label: string }

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  /** Shown when `value` isn't one of the options. */
  placeholder?: string
  required?: boolean
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

/**
 * A dropdown in the app's own style, replacing the browser's. The button keeps focus while the
 * list is open (the highlighted option is announced through aria-activedescendant), so it works
 * the same by keyboard, mouse and touch: arrows, Home/End, typing to jump, Enter to choose.
 */
export default function Select({ id, value, onChange, options, placeholder = 'Choose…', required, disabled, ...aria }: Props) {
  const listId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = options.findIndex((o) => o.value === value)
  const optionId = (i: number) => `${listId}-${i}`

  function show() {
    setActive(Math.max(0, selected))
    setOpen(true)
  }

  function choose(i: number) {
    const option = options[i]
    if (option) onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  // Keep the highlighted option in view, which matters in long lists such as banks.
  const showActive = () => listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  useEffect(() => {
    if (open) showActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the highlight as it moves
  }, [open, active])

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1
    const move = (to: number) => {
      e.preventDefault()
      if (!open) show()
      else setActive(Math.min(last, Math.max(0, to)))
    }
    switch (e.key) {
      case 'ArrowDown':
        return move(open ? active + 1 : Math.max(0, selected))
      case 'ArrowUp':
        return move(open ? active - 1 : Math.max(0, selected))
      case 'Home':
        return move(0)
      case 'End':
        return move(last)
      case 'Enter':
      case ' ':
        e.preventDefault()
        return open ? choose(active) : show()
      case 'Escape':
        if (open) {
          e.preventDefault()
          setOpen(false)
        }
        return
      case 'Tab':
        setOpen(false)
        return
    }
    // Typing jumps to the next option starting with those letters.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now()
      typed.current.text = (now - typed.current.at > 600 ? '' : typed.current.text) + e.key.toLowerCase()
      typed.current.at = now
      const from = open ? active : Math.max(0, selected)
      const order = [...options.keys()].map((_, n) => (from + (typed.current.text.length > 1 ? 0 : 1) + n) % options.length)
      const hit = order.find((i) => options[i]!.label.toLowerCase().startsWith(typed.current.text))
      if (hit !== undefined) {
        e.preventDefault()
        if (!open) setOpen(true)
        setActive(hit)
      }
    }
  }

  const label = options[selected]?.label

  return (
    <div className="select">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className="select-button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        {...aria}
      >
        <span className={label ? 'select-value' : 'select-value select-value--placeholder'}>{label ?? placeholder}</span>
        <svg className="select-chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {/* Lets a required Select block a form's submit with the browser's own message. */}
      {required && <input className="select-proxy" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} />}

      <Popover anchor={buttonRef} open={open} onClose={() => setOpen(false)} onPlaced={showActive} matchWidth>
        <ul ref={listRef} id={listId} role="listbox" className="select-list" aria-label={aria['aria-label']}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={optionId(i)}
              role="option"
              aria-selected={i === selected}
              className={i === active ? 'select-option select-option--active' : 'select-option'}
              // Keep focus on the button, so keyboard use carries on after a tap or click.
              onPointerDown={(e) => e.preventDefault()}
              onPointerMove={() => setActive(i)}
              onClick={() => choose(i)}
            >
              {o.label}
              {i === selected && (
                <svg className="select-check" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  )
}
