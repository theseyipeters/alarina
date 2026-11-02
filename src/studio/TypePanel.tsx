import {
  BODY_FONTS,
  elorienCanRender,
  FONTS,
  isScript,
  HEADING_FONTS,
  JOINERS,
  NAME_CASES,
  NAME_FONTS,
  NAME_SCALE,
  PAIRINGS,
  resolveLook,
  templateOf,
  type Font,
  type InvitationLook,
  type Joiner,
  type NameCase,
} from '../invite/design.ts'
import { formatDate } from '../lib/format.ts'
import { PanelSection, Segmented } from './parts.tsx'
import type { PanelProps } from './types.ts'

type Role = 'namesFont' | 'headingFont' | 'bodyFont'

export default function TypePanel({ design, change, invitation }: PanelProps) {
  const resolved = resolveLook(design.template, design.look)
  const layoutDefaults = resolveLook(design.template, null)
  const setLook = (patch: Partial<InvitationLook>, group?: string) =>
    change((d) => ({ ...d, look: { ...d.look, ...patch } }), group)

  const one = invitation.partnerOneName || 'Ada'
  const two = invitation.partnerTwoName || 'Tunde'
  const elorienFallback = resolved.namesFont === 'elorien' && !elorienCanRender(`${one}${two}`)

  return (
    <>
      <PanelSection title="Pairings" hint="Fonts for names, headings and text that suit each other.">
        <div className="studio-pairings">
          {PAIRINGS.map((p) => {
            const inUse = (Object.keys(p.fonts) as Role[]).every((k) => p.fonts[k] === resolved[k])
            return (
              <button
                key={p.id}
                type="button"
                className="studio-pairing"
                aria-pressed={inUse}
                onClick={() => setLook(p.fonts)}
              >
                <span className="studio-pairing-names" data-font={p.fonts.namesFont}>
                  {one} {JOINERS[resolved.joiner]} {two}
                </span>
                <span className="studio-pairing-label">{p.label}</span>
                <span className="hint">
                  {FONTS[p.fonts.headingFont].label} · {FONTS[p.fonts.bodyFont].label}
                </span>
              </button>
            )
          })}
        </div>
      </PanelSection>

      <FontPicker
        title="Names"
        role="namesFont"
        fonts={NAME_FONTS}
        value={design.look.namesFont}
        layoutDefault={layoutDefaults.namesFont}
        sample={`${one} ${JOINERS[resolved.joiner]} ${two}`}
        onChange={(namesFont) => setLook({ namesFont })}
        note={
          elorienFallback
            ? `Elorien can’t draw every letter in your names, so both are set in ${FONTS[resolved.headingFont].label} instead.`
            : undefined
        }
      />
      <FontPicker
        title="Headings and dates"
        role="headingFont"
        fonts={HEADING_FONTS}
        value={design.look.headingFont}
        layoutDefault={layoutDefaults.headingFont}
        sample="Kindly reply"
        onChange={(headingFont) => setLook({ headingFont })}
      />
      <FontPicker
        title="Text"
        role="bodyFont"
        fonts={BODY_FONTS}
        value={design.look.bodyFont}
        layoutDefault={layoutDefaults.bodyFont}
        sample={formatDate(invitation.date) || 'Saturday, 20 February 2027'}
        onChange={(bodyFont) => setLook({ bodyFont })}
      />

      <PanelSection title="Names">
        <div className="studio-range">
          <label htmlFor="name-scale">Size</label>
          <output htmlFor="name-scale">{resolved.nameScale}%</output>
          <input
            id="name-scale"
            type="range"
            min={NAME_SCALE.min}
            max={NAME_SCALE.max}
            step={5}
            value={resolved.nameScale}
            onChange={(e) => {
              const v = Number(e.target.value)
              setLook({ nameScale: v === 100 ? null : v }, 'name-scale')
            }}
          />
        </div>
        <p className="hint">Long names still shrink to stay on one line.</p>

        <h4 className="studio-label">Letters</h4>
        <Segmented<NameCase>
          name="name-case"
          legend="Letters"
          options={Object.entries(NAME_CASES).map(([value, label]) => ({ value: value as NameCase, label }))}
          value={resolved.nameCase}
          onChange={(nameCase) => setLook({ nameCase })}
        />
        {isScript(resolved.namesFont) && resolved.nameCase === 'capitals' && (
          <p className="hint studio-note">Script fonts aren’t made for capitals, so your names stay as typed.</p>
        )}

        <h4 className="studio-label">Between the names</h4>
        <Segmented<Joiner>
          name="joiner"
          legend="Between the names"
          options={Object.entries(JOINERS).map(([value, label]) => ({ value: value as Joiner, label }))}
          value={resolved.joiner}
          onChange={(joiner) => setLook({ joiner })}
        />
      </PanelSection>

      <button
        type="button"
        className="btn btn--secondary btn--block"
        onClick={() =>
          setLook({ namesFont: null, headingFont: null, bodyFont: null, nameScale: null, nameCase: null, joiner: null })
        }
      >
        Reset to {templateOf(design.template).label} type
      </button>
    </>
  )
}

/** One font role as a list of samples. The first choice follows the layout's own font. */
function FontPicker<F extends Font>({
  title,
  role,
  fonts,
  value,
  layoutDefault,
  sample,
  onChange,
  note,
}: {
  title: string
  role: Role
  fonts: readonly F[]
  value: F | null
  layoutDefault: Font
  sample: string
  onChange: (font: F | null) => void
  note?: string
}) {
  const options: { font: F | null; shown: Font; label: string }[] = [
    { font: null, shown: layoutDefault, label: `Layout default · ${FONTS[layoutDefault].label}` },
    ...fonts.map((f) => ({ font: f, shown: f, label: FONTS[f].label })),
  ]
  return (
    <PanelSection title={title}>
      <fieldset className="studio-fonts">
        <legend className="visually-hidden">{title} font</legend>
        {options.map((o) => (
          <label key={o.font ?? 'default'} className="studio-font">
            <input
              type="radio"
              className="visually-hidden"
              name={`font-${role}`}
              checked={value === o.font}
              onChange={() => onChange(o.font)}
            />
            <span className={`studio-font-sample studio-font-sample--${role}`} data-font={o.shown}>
              {sample}
            </span>
            <span className="studio-font-label">
              {o.label}
              {o.font && <span className="hint"> · {FONTS[o.font].kind}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      {note && <p className="hint studio-note">{note}</p>}
    </PanelSection>
  )
}
