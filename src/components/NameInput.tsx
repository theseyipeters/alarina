import { useLayoutEffect, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { insertLetter, NAME_LETTERS, toggleToneMark, TONE_MARKS, type Edit } from '../lib/accents.ts'

type Props = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  /** Names the keys for screen readers, such as "Father". */
  label: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  placeholder?: string
  /** Sits beside the input, such as the "Late" box. */
  aside?: ReactNode
}

/**
 * A name field with keys for the Yoruba letters and tone marks most keyboards don't have. They show
 * while the field is in use, and only ever add what the couple taps: a name is never changed for them.
 */
export default function NameInput({ label, value, onChange, maxLength, placeholder, aside, ...input }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)

  // Puts the cursor back in the same commit as the new value, so the next keystroke can't land elsewhere.
  useLayoutEffect(() => {
    if (caret.current === null) return
    ref.current?.focus()
    ref.current?.setSelectionRange(caret.current, caret.current)
    caret.current = null
  }, [value])

  function apply(edit: (start: number, end: number) => Edit | null) {
    const el = ref.current
    if (!el) return
    const result = edit(el.selectionStart ?? value.length, el.selectionEnd ?? value.length)
    if (result && result.value !== value && result.value.length <= maxLength) {
      caret.current = result.caret
      onChange(result.value)
    } else {
      el.focus()
    }
  }

  // Keeps the cursor in the field, and the phone's keyboard open, while a key is pressed.
  const keepFocus = (e: SyntheticEvent) => e.preventDefault()

  const key = (text: string, name: string, edit: (start: number, end: number) => Edit | null) => (
    <button key={name} type="button" className="name-key" aria-label={name} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => apply(edit)}>
      {text}
    </button>
  )

  const field = <input {...input} ref={ref} type="text" autoComplete="off" spellCheck={false} maxLength={maxLength} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />

  return (
    <div className="name-input">
      {aside ? <div className="parent-input">{field}{aside}</div> : field}
      <div className="name-keys">
        <div role="group" aria-label={`Yoruba letters and tone marks for ${label}`}>
          {NAME_LETTERS.map((letter) => key(letter, `Add ${letter}`, (start, end) => insertLetter(value, start, end, letter)))}
          {key('´', 'High tone on the letter before the cursor', (_, end) => toggleToneMark(value, end, TONE_MARKS.high))}
          {key('`', 'Low tone on the letter before the cursor', (_, end) => toggleToneMark(value, end, TONE_MARKS.low))}
        </div>
        <span className="hint">Tap ´ or ` to mark the letter before your cursor.</span>
      </div>
    </div>
  )
}
