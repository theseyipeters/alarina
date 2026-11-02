/** The four colours a couple picks for a custom palette. Hex, like #1e1b18. */
export type CustomColors = { background: string; card: string; text: string; accent: string }

type Rgb = [number, number, number]

const toRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb
const toHex = (rgb: Rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`

export const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

/** `a` mixed into `b`: 0 is all `b`, 1 is all `a`. */
export const mix = (a: string, b: string, amount: number) => {
  const [x, y] = [toRgb(a), toRgb(b)]
  return toHex(x.map((c, i) => c * amount + y[i]! * (1 - amount)) as Rgb)
}

function luminance(hex: string) {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, from 1 to 21. */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** The least amount of `from` mixed into `base` that reaches `ratio` against every colour in `against`. */
function reach(from: string, base: string, against: string[], ratio: number, start: number) {
  for (let t = start; t <= 1; t += 0.02) {
    const c = mix(from, base, t)
    if (against.every((x) => contrast(c, x) >= ratio)) return c
  }
  return from
}

/**
 * Every invitation token from the couple's four colours, so buttons, fields and alerts follow
 * the custom palette like any preset. Muted text and field borders are pushed until they meet
 * AA; the checks report the pairs the couple controls directly.
 */
export function derivePalette(c: CustomColors) {
  const surfaces = [c.background, c.card]
  const tone: 'light' | 'dark' = luminance(c.card) < 0.18 ? 'dark' : 'light'
  // Button text in the card colour when it reads well enough, else whichever reads best.
  const onPrimary =
    contrast(c.card, c.accent) >= 4.5
      ? c.card
      : [c.text, '#ffffff', '#111111'].reduce((best, x) => (contrast(x, c.accent) > contrast(best, c.accent) ? x : best))

  const vars = {
    '--bg': c.background,
    '--surface': c.card,
    '--text': c.text,
    '--text-muted': reach(c.text, c.card, surfaces, 4.5, 0.62),
    '--border': mix(c.text, c.card, 0.14),
    '--field-border': reach(c.text, c.card, [c.card], 3, 0.4),
    '--primary': c.accent,
    '--primary-hover': mix(c.text, c.accent, 0.18),
    '--on-primary': onPrimary,
    '--accent': c.accent,
    '--focus': c.accent,
  }

  const checks = [
    { id: 'text', label: 'Text on card', ratio: contrast(c.text, c.card), min: 4.5 },
    { id: 'page', label: 'Text on page', ratio: contrast(c.text, c.background), min: 4.5 },
    { id: 'accent', label: 'Accent on card', ratio: contrast(c.accent, c.card), min: 4.5 },
    { id: 'button', label: 'Button text', ratio: contrast(onPrimary, c.accent), min: 4.5 },
  ]

  return { vars, tone, checks }
}

/** Nudges text and accent towards black or white until each meets AA on the card and page. */
export function fixContrast(c: CustomColors): CustomColors {
  const surfaces = [c.background, c.card]
  const extreme = luminance(c.card) < 0.18 ? '#ffffff' : '#000000'
  const push = (color: string) => {
    for (let t = 0; t <= 1; t += 0.02) {
      const next = mix(extreme, color, t)
      if (surfaces.every((s) => contrast(next, s) >= 4.5)) return next
    }
    return extreme
  }
  return { ...c, text: push(c.text), accent: push(c.accent) }
}
