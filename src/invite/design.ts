import { ELORIEN_RANGES } from './elorienCoverage.ts'

// Keep these ids in step with be/src/lib/design.ts.
export const TEMPLATES = [
  { id: 'classic', label: 'Classic', description: 'Centred and formal, set in Instrument Serif.' },
  { id: 'modern', label: 'Modern', description: 'Large names in Elorien with clean detail rows.' },
  { id: 'editorial', label: 'Editorial', description: 'Left-aligned with an italic ampersand.' },
] as const

// Colours live in invite.css, scoped by data-palette. Every pair there meets WCAG AA.
export const PALETTES = [
  { id: 'ivory', label: 'Ivory' },
  { id: 'sage', label: 'Sage' },
  { id: 'blush', label: 'Blush' },
  { id: 'emerald', label: 'Emerald and gold' },
  { id: 'midnight', label: 'Midnight' },
] as const

export type Template = (typeof TEMPLATES)[number]['id']
export type Palette = (typeof PALETTES)[number]['id']

/**
 * Whether Elorien can draw every character in `text`. Elorien has no ọ, ẹ, ṣ, ń or ₦, so a line
 * that needs one is set entirely in the fallback serif, never with mixed fonts inside a word.
 */
export function elorienCanRender(text: string) {
  for (const ch of text.normalize('NFC')) {
    const cp = ch.codePointAt(0)!
    if (!ELORIEN_RANGES.some(([a, b]) => cp >= a && cp <= b)) return false
  }
  return true
}
