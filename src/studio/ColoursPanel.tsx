import { useRef, useState, type CSSProperties } from 'react'
import { derivePalette, fixContrast, isHex, type CustomColors } from '../invite/colors.ts'
import { PALETTES } from '../invite/design.ts'
import { PanelSection } from './parts.tsx'
import type { PanelProps } from './types.ts'

const FIELDS: { key: keyof CustomColors; label: string }[] = [
  { key: 'background', label: 'Page' },
  { key: 'card', label: 'Card' },
  { key: 'text', label: 'Text' },
  { key: 'accent', label: 'Accent' },
]

export default function ColoursPanel({ design, change }: PanelProps) {
  const swatches = useRef<Record<string, HTMLElement | null>>({})
  const colors = design.look.colors
  const custom = design.palette === 'custom' && colors

  const setColors = (next: CustomColors, group?: string) =>
    change((d) => ({ ...d, palette: 'custom', look: { ...d.look, colors: next } }), group)

  // Starts from the palette on screen, read from its swatch, so invite.css stays the one source of preset colours.
  function customise() {
    const el = swatches.current[design.palette]
    if (!el) return
    const css = getComputedStyle(el)
    const read = (token: string) => css.getPropertyValue(token).trim().toLowerCase()
    setColors({ background: read('--bg'), card: read('--surface'), text: read('--text'), accent: read('--accent') })
  }

  const checks = custom ? derivePalette(colors).checks : []
  const failing = checks.some((c) => c.ratio < c.min)

  return (
    <>
      <PanelSection title="Palettes" hint="Every palette is checked for contrast, so guests can always read it.">
        <fieldset className="studio-swatches">
          <legend className="visually-hidden">Palette</legend>
          {PALETTES.map((p) => (
            <label key={p.id} className="studio-swatch-option">
              <input
                type="radio"
                className="visually-hidden"
                name="studio-palette"
                checked={design.palette === p.id}
                onChange={() => change({ ...design, palette: p.id })}
              />
              <Swatch palette={p.id} ref={(el) => void (swatches.current[p.id] = el)} />
              <span>{p.label}</span>
            </label>
          ))}
          {colors && (
            <label className="studio-swatch-option">
              <input
                type="radio"
                className="visually-hidden"
                name="studio-palette"
                checked={design.palette === 'custom'}
                onChange={() => change({ ...design, palette: 'custom' })}
              />
              <Swatch palette="custom" style={derivePalette(colors).vars as CSSProperties} />
              <span>Your colours</span>
            </label>
          )}
        </fieldset>
      </PanelSection>

      <PanelSection
        title="Your own colours"
        hint={custom ? 'Pick four colours. Lighter text and borders are worked out from them.' : 'Start from the palette you have now and adjust any colour.'}
      >
        {custom ? (
          <>
            <div className="studio-colours">
              {FIELDS.map((f) => (
                <ColourField
                  key={f.key}
                  id={`colour-${f.key}`}
                  label={f.label}
                  value={colors[f.key]}
                  onChange={(v) => setColors({ ...colors, [f.key]: v }, `colour-${f.key}`)}
                />
              ))}
            </div>
            <ul className="studio-checks" aria-label="Contrast">
              {checks.map((c) => (
                <li key={c.id}>
                  <span>{c.label}</span>
                  <span className="studio-ratio">{c.ratio.toFixed(1)} : 1</span>
                  <span className={c.ratio >= c.min ? 'badge badge--live' : 'badge badge--warn'}>
                    {c.ratio >= c.min ? 'Readable' : 'Too faint'}
                  </span>
                </li>
              ))}
            </ul>
            {failing && (
              <button type="button" className="btn btn--secondary btn--block" onClick={() => setColors(fixContrast(colors))}>
                Fix contrast
              </button>
            )}
          </>
        ) : (
          <button type="button" className="btn btn--secondary btn--block" onClick={customise}>
            Customise these colours
          </button>
        )}
      </PanelSection>
    </>
  )
}

/** A tiny card in a palette's own colours: page, card, text and accent. */
function Swatch({ palette, style, ref }: { palette: string; style?: CSSProperties; ref?: (el: HTMLElement | null) => void }) {
  return (
    <span className="studio-swatch" data-palette={palette} style={style} ref={ref} aria-hidden="true">
      <span className="studio-swatch-card">
        <span className="studio-swatch-aa">Aa</span>
        <span className="studio-swatch-dot" />
      </span>
    </span>
  )
}

const normalise = (value: string) => {
  const v = (value.startsWith('#') ? value : `#${value}`).trim().toLowerCase()
  return isHex(v) ? v : null
}

/** A colour picker beside its hex value. Typing a hex applies it as soon as it's a full colour. */
function ColourField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <div className="studio-colour">
      <input
        type="color"
        className="studio-colour-picker"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} colour`}
      />
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="studio-hex"
        value={draft ?? value}
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        onFocus={() => setDraft(value)}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value)
          const v = normalise(e.target.value)
          if (v) onChange(v)
        }}
      />
    </div>
  )
}
