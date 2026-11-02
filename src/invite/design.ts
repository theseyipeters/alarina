import type { CSSProperties } from 'react'
import { derivePalette, type CustomColors } from './colors.ts'
import { ELORIEN_RANGES } from './elorienCoverage.ts'

// Keep these ids in step with be/src/lib/design.ts.

/* ── Fonts ──────────────────────────────────────────────────────────── */

// Every font here except Instrument Serif and Elorien draws ọ, ẹ, ṣ, ń and ₦ itself, so Yoruba
// names never mix fonts. Checked against the font files; recheck before adding one.
export const FONTS = {
  instrument: { label: 'Instrument Serif', kind: 'Serif' },
  elorien: { label: 'Elorien', kind: 'Display' },
  cormorant: { label: 'Cormorant Garamond', kind: 'Serif' },
  'noto-display': { label: 'Noto Serif Display', kind: 'High-contrast serif' },
  'great-vibes': { label: 'Great Vibes', kind: 'Script' },
  ballet: { label: 'Ballet', kind: 'Script' },
  unbounded: { label: 'Unbounded', kind: 'Wide sans' },
  'eb-garamond': { label: 'EB Garamond', kind: 'Book serif' },
  spectral: { label: 'Spectral', kind: 'Book serif' },
  geist: { label: 'Geist', kind: 'Sans' },
  montserrat: { label: 'Montserrat', kind: 'Geometric sans' },
  'work-sans': { label: 'Work Sans', kind: 'Sans' },
  'nunito-sans': { label: 'Nunito Sans', kind: 'Rounded sans' },
} as const

export type Font = keyof typeof FONTS

export const NAME_FONTS = ['instrument', 'elorien', 'cormorant', 'noto-display', 'great-vibes', 'ballet', 'unbounded'] as const
export const HEADING_FONTS = ['instrument', 'cormorant', 'noto-display', 'eb-garamond', 'spectral', 'unbounded'] as const
export const BODY_FONTS = ['geist', 'eb-garamond', 'spectral', 'montserrat', 'work-sans', 'nunito-sans'] as const

export type NamesFont = (typeof NAME_FONTS)[number]
export type HeadingFont = (typeof HEADING_FONTS)[number]
export type BodyFont = (typeof BODY_FONTS)[number]

/* ── Fine-tuning ────────────────────────────────────────────────────── */

export const JOINERS = { amp: '&', and: 'and', plus: '+', weds: 'weds' } as const
export const TEXTURES = { none: 'None', paper: 'Paper', linen: 'Linen', dots: 'Dots', glow: 'Glow' } as const
export const CORNERS = { sharp: 'Sharp', soft: 'Soft', round: 'Round' } as const
export const FRAMES = { hairline: 'Hairline', none: 'None', double: 'Double', accent: 'Bold' } as const
export const NAME_CASES = { 'as-typed': 'As typed', capitals: 'Capitals' } as const
export const NAME_SCALE = { min: 80, max: 120 } as const

export type Joiner = keyof typeof JOINERS
export type Texture = keyof typeof TEXTURES
export type Corners = keyof typeof CORNERS
export type Frame = keyof typeof FRAMES
export type NameCase = keyof typeof NAME_CASES

/** Studio choices. Null follows the template's own default. */
export type InvitationLook = {
  namesFont: NamesFont | null
  headingFont: HeadingFont | null
  bodyFont: BodyFont | null
  nameScale: number | null
  nameCase: NameCase | null
  joiner: Joiner | null
  texture: Texture | null
  corners: Corners | null
  frame: Frame | null
  colors: CustomColors | null
}

export const EMPTY_LOOK: InvitationLook = {
  namesFont: null,
  headingFont: null,
  bodyFont: null,
  nameScale: null,
  nameCase: null,
  joiner: null,
  texture: null,
  corners: null,
  frame: null,
  colors: null,
}

type Resolved = { [K in Exclude<keyof InvitationLook, 'colors'>]: NonNullable<InvitationLook[K]> }

/* ── Templates ──────────────────────────────────────────────────────── */

const BASE: Resolved = {
  namesFont: 'instrument',
  headingFont: 'instrument',
  bodyFont: 'geist',
  nameScale: 100,
  nameCase: 'as-typed',
  joiner: 'amp',
  texture: 'none',
  corners: 'soft',
  frame: 'hairline',
}

export const TEMPLATES = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Centred and formal, set in Instrument Serif.',
    defaults: {},
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Large names in Elorien with clean detail rows.',
    defaults: { namesFont: 'elorien', joiner: 'plus' },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Left-aligned with an italic ampersand.',
    defaults: { joiner: 'and' },
  },
  {
    id: 'garden',
    label: 'Garden',
    description: 'A leafy wreath with your initials and flowing script names.',
    defaults: { namesFont: 'great-vibes', headingFont: 'cormorant', bodyFont: 'eb-garamond', texture: 'paper' },
  },
  {
    id: 'deco',
    label: 'Deco',
    description: 'Art deco frame, a sunburst and stepped corners.',
    defaults: { namesFont: 'noto-display', headingFont: 'noto-display', bodyFont: 'montserrat', corners: 'sharp' },
  },
  {
    id: 'adire',
    label: 'Adire',
    description: 'Bands inspired by indigo adire cloth, with a date stamp.',
    defaults: { namesFont: 'cormorant', headingFont: 'cormorant', bodyFont: 'work-sans' },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Quiet and spacious, with the details in two columns.',
    defaults: { joiner: 'and', corners: 'sharp' },
  },
  {
    id: 'poster',
    label: 'Poster',
    description: 'Bold block of colour and the date in giant numerals.',
    defaults: { namesFont: 'unbounded', headingFont: 'unbounded', bodyFont: 'work-sans', joiner: 'plus', corners: 'sharp' },
  },
] as const satisfies readonly { id: string; label: string; description: string; defaults: Partial<Resolved> }[]

export type Template = (typeof TEMPLATES)[number]['id']

/* ── Palettes ───────────────────────────────────────────────────────── */

// Colours live in invite.css, scoped by data-palette. Every pair there meets WCAG AA.
export const PALETTES = [
  { id: 'ivory', label: 'Ivory' },
  { id: 'sage', label: 'Sage' },
  { id: 'blush', label: 'Blush' },
  { id: 'terracotta', label: 'Terracotta' },
  { id: 'champagne', label: 'Champagne' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'noir', label: 'Noir' },
  { id: 'emerald', label: 'Emerald and gold' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'wine', label: 'Wine' },
] as const

/** A preset, or 'custom' for the couple's own colours (kept in look.colors). */
export type Palette = (typeof PALETTES)[number]['id'] | 'custom'

/* ── Curated looks ──────────────────────────────────────────────────── */

export type Design = { template: Template; palette: Palette; look: InvitationLook }

export const LOOKS: { id: string; label: string; design: Omit<Design, 'look'> & { look: Partial<InvitationLook> } }[] = [
  { id: 'lagos-gold', label: 'Lagos gold', design: { template: 'deco', palette: 'emerald', look: { frame: 'accent' } } },
  { id: 'garden-party', label: 'Garden party', design: { template: 'garden', palette: 'sage', look: {} } },
  { id: 'indigo-adire', label: 'Indigo adire', design: { template: 'adire', palette: 'indigo', look: {} } },
  {
    id: 'rose-romance',
    label: 'Rose romance',
    design: {
      template: 'classic',
      palette: 'blush',
      look: { namesFont: 'great-vibes', headingFont: 'cormorant', bodyFont: 'eb-garamond', texture: 'paper' },
    },
  },
  {
    id: 'midnight-gala',
    label: 'Midnight gala',
    design: { template: 'deco', palette: 'midnight', look: { texture: 'glow', frame: 'double' } },
  },
  {
    id: 'gallery',
    label: 'Gallery',
    design: { template: 'minimal', palette: 'noir', look: { namesFont: 'noto-display', headingFont: 'noto-display' } },
  },
  { id: 'sunset-poster', label: 'Sunset poster', design: { template: 'poster', palette: 'terracotta', look: {} } },
  {
    id: 'vintage-press',
    label: 'Vintage press',
    design: {
      template: 'editorial',
      palette: 'champagne',
      look: { headingFont: 'cormorant', namesFont: 'cormorant', bodyFont: 'spectral', texture: 'linen' },
    },
  },
  {
    id: 'velvet',
    label: 'Velvet',
    design: { template: 'garden', palette: 'wine', look: { namesFont: 'ballet', texture: 'glow' } },
  },
  {
    id: 'coastal',
    label: 'Coastal',
    design: {
      template: 'modern',
      palette: 'ocean',
      look: { namesFont: 'cormorant', headingFont: 'cormorant', bodyFont: 'nunito-sans', texture: 'dots' },
    },
  },
  {
    id: 'lavender-letter',
    label: 'Lavender letter',
    design: {
      template: 'editorial',
      palette: 'lavender',
      look: { namesFont: 'ballet', headingFont: 'spectral', bodyFont: 'spectral', corners: 'round' },
    },
  },
  {
    id: 'champagne-toast',
    label: 'Champagne toast',
    design: { template: 'garden', palette: 'champagne', look: { namesFont: 'noto-display', frame: 'double' } },
  },
]

export const lookDesign = (look: (typeof LOOKS)[number]): Design => ({
  ...look.design,
  look: { ...EMPTY_LOOK, ...look.design.look },
})

/** Font pairings offered as one-click starting points in the Studio. */
export const PAIRINGS: { id: string; label: string; fonts: Pick<Resolved, 'namesFont' | 'headingFont' | 'bodyFont'> }[] = [
  { id: 'timeless', label: 'Timeless', fonts: { namesFont: 'instrument', headingFont: 'instrument', bodyFont: 'geist' } },
  { id: 'romantic', label: 'Romantic', fonts: { namesFont: 'great-vibes', headingFont: 'cormorant', bodyFont: 'eb-garamond' } },
  { id: 'couture', label: 'Couture', fonts: { namesFont: 'noto-display', headingFont: 'noto-display', bodyFont: 'montserrat' } },
  { id: 'storybook', label: 'Storybook', fonts: { namesFont: 'ballet', headingFont: 'cormorant', bodyFont: 'spectral' } },
  { id: 'bold', label: 'Bold', fonts: { namesFont: 'unbounded', headingFont: 'unbounded', bodyFont: 'work-sans' } },
  { id: 'literary', label: 'Literary', fonts: { namesFont: 'cormorant', headingFont: 'cormorant', bodyFont: 'eb-garamond' } },
  { id: 'signature', label: 'Signature', fonts: { namesFont: 'elorien', headingFont: 'instrument', bodyFont: 'geist' } },
  { id: 'fresh', label: 'Fresh', fonts: { namesFont: 'noto-display', headingFont: 'spectral', bodyFont: 'nunito-sans' } },
]

/* ── Applying a design ──────────────────────────────────────────────── */

export const templateOf = (id: Template) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]

/** Every choice filled in: the couple's own, else the template's default. */
export function resolveLook(template: Template, look: InvitationLook | null | undefined): Resolved {
  const resolved = { ...BASE, ...(templateOf(template).defaults as Partial<Resolved>) }
  for (const [key, value] of Object.entries(look ?? {})) {
    if (key !== 'colors' && value != null) (resolved as Record<string, unknown>)[key] = value
  }
  return resolved
}

type DesignSource = { template: Template; palette: Palette; look?: InvitationLook | null } & {
  partnerOneName?: string | null
  partnerTwoName?: string | null
}

/**
 * The attributes that style an invitation: put them on the `.inv` wrapper. Fonts, texture and
 * shape are data attributes styled in invite.css; only custom colours and the name size are inline.
 */
export function inviteAttrs(w: DesignSource) {
  const look = resolveLook(w.template, w.look)
  const colors = w.palette === 'custom' ? w.look?.colors : null
  const style: Record<string, string | number> = {}
  if (look.nameScale !== 100) style['--name-scale'] = look.nameScale / 100
  if (colors) Object.assign(style, derivePalette(colors).vars)

  // Elorien sets the names only when it can draw every character of both, so the pair always
  // matches; otherwise both stay in the heading font.
  const both = `${w.partnerOneName ?? ''}${w.partnerTwoName ?? ''}`
  const namesFont = look.namesFont === 'elorien' && !elorienCanRender(both) ? look.headingFont : look.namesFont
  // Script letters aren't drawn to be set in capitals, so script names always stay as typed.
  const nameCase = isScript(namesFont) ? 'as-typed' : look.nameCase

  return {
    'data-template': w.template,
    'data-palette': colors ? 'custom' : w.palette === 'custom' ? 'ivory' : w.palette,
    'data-tone': colors ? derivePalette(colors).tone : undefined,
    'data-names-font': namesFont,
    'data-heading-font': look.headingFont,
    'data-body-font': look.bodyFont,
    'data-name-case': nameCase,
    'data-texture': look.texture,
    'data-corners': look.corners,
    'data-frame': look.frame,
    style: style as CSSProperties,
  }
}

export const isScript = (font: Font) => FONTS[font].kind === 'Script'

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
