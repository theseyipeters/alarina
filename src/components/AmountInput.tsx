import { useLayoutEffect, useRef, type InputHTMLAttributes } from 'react'
import { formatNaira, groupDigits } from '../lib/money.ts'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max' | 'placeholder'> & {
  id: string
  /** Whole naira as digits, "" when empty. */
  value: string
  onChange: (digits: string) => void
  /** Whole naira. Checked as the form is sent, with a message in naira. */
  min?: number
  max?: number
  /** An example amount in whole naira, shown grouped: 150000 → "150,000". */
  placeholder?: number
}

/** Longest amount anyone could mean: ₦999,999,999,999. */
const MAX_DIGITS = 12

/** Keeps only the naira digits: drops "₦", commas and spaces, and anything after a decimal point. */
const digitsOf = (text: string) => text.split('.')[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_DIGITS)

/** Where the caret goes in `formatted` so that `digits` digits sit before it. */
function caretAfterDigits(formatted: string, digits: number) {
  if (digits <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]) && ++seen === digits) return i + 1
  }
  return formatted.length
}

/**
 * An amount in naira, with ₦ before it and commas as you type ("1,250,000"). The value stays plain
 * digits, so forms send the same whole-naira numbers as before. It shows the number keypad on phones,
 * and, unlike a number field, doesn't change if you scroll over it.
 */
export default function AmountInput({ id, value, onChange, min, max, placeholder, className, ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  // After a keystroke: how many digits were before the caret, so it can go back to the same place.
  const caret = useRef<number | null>(null)
  const formatted = groupDigits(value)

  useLayoutEffect(() => {
    const input = ref.current
    if (input && caret.current !== null && document.activeElement === input) {
      const at = caretAfterDigits(formatted, caret.current)
      input.setSelectionRange(at, at)
    }
    caret.current = null
  }, [formatted])

  // Below the least or over the most: the browser blocks the form and says why, in naira.
  useLayoutEffect(() => {
    const n = value ? Number(value) : null
    const message =
      n !== null && min !== undefined && n < min
        ? `Enter at least ${formatNaira(min * 100)}.`
        : n !== null && max !== undefined && n > max
          ? `Enter no more than ${formatNaira(max * 100)}.`
          : ''
    ref.current?.setCustomValidity(message)
  }, [value, min, max])

  const describedBy = [rest['aria-describedby'], `${id}-currency`].filter(Boolean).join(' ')

  return (
    <span className="amount">
      <span className="amount-sign" aria-hidden="true">
        ₦
      </span>
      <input
        {...rest}
        ref={ref}
        id={id}
        className={className ? `amount-input ${className}` : 'amount-input'}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-describedby={describedBy}
        placeholder={placeholder === undefined ? undefined : groupDigits(String(placeholder))}
        value={formatted}
        onKeyDown={(e) => {
          // Backspace just after a comma (or Delete just before one) removes the digit beside it,
          // instead of a comma that would only come straight back.
          const input = e.currentTarget
          const at = input.selectionStart
          if (at === null || at !== input.selectionEnd) return
          if (e.key === 'Backspace' && input.value[at - 1] === ',') input.setSelectionRange(at - 1, at - 1)
          if (e.key === 'Delete' && input.value[at] === ',') input.setSelectionRange(at + 1, at + 1)
          rest.onKeyDown?.(e)
        }}
        onChange={(e) => {
          const { value: text, selectionStart } = e.target
          const digits = digitsOf(text)
          const before = digitsOf(text.slice(0, selectionStart ?? text.length)).length
          if (digits === value) {
            // Nothing changed (a letter, say): React puts the old text back, and the caret with it.
            const input = e.target
            requestAnimationFrame(() => {
              const at = caretAfterDigits(formatted, before)
              input.setSelectionRange(at, at)
            })
            return
          }
          caret.current = before
          onChange(digits)
        }}
      />
      <span id={`${id}-currency`} className="visually-hidden">
        In naira
      </span>
    </span>
  )
}
