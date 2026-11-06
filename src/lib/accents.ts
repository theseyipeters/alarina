export const NAME_LETTERS = ['ọ', 'ẹ', 'ṣ'] as const
export const TONE_MARKS = { high: '́', low: '̀' } as const

export type Edit = { value: string; caret: number }

/** Types an under-dot letter at the cursor. Names start with a capital, so a new word gets one. */
export function insertLetter(value: string, start: number, end: number, letter: string): Edit {
  const before = value.slice(0, start)
  const typed = before === '' || /\s$/.test(before) ? letter.toUpperCase() : letter
  return { value: before + typed + value.slice(end), caret: start + typed.length }
}

/**
 * Puts a tone mark on the letter before the cursor. It replaces the other tone if there is one, and
 * tapping the same tone again takes it off. Null when there's no letter there to mark.
 */
export function toggleToneMark(value: string, end: number, mark: string): Edit | null {
  const before = value.slice(0, end)
  const letter = before.match(/\p{L}\p{M}*$/u)?.[0]
  if (!letter) return null
  const parts = letter.normalize('NFD')
  const bare = parts.replace(/[̀́]/g, '')
  const marked = (parts.includes(mark) ? bare : bare + mark).normalize('NFC')
  const head = before.slice(0, -letter.length) + marked
  return { value: head + value.slice(end), caret: head.length }
}
