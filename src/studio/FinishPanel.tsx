import { CORNERS, FRAMES, inviteAttrs, resolveLook, templateOf, TEXTURES, type InvitationLook } from '../invite/design.ts'
import { PanelSection } from './parts.tsx'
import type { PanelProps } from './types.ts'

type Key = 'texture' | 'corners' | 'frame'

const GROUPS: { key: Key; title: string; hint: string; options: Record<string, string> }[] = [
  { key: 'texture', title: 'Texture', hint: 'A subtle surface for the card, in your palette’s colours.', options: TEXTURES },
  { key: 'corners', title: 'Corners', hint: 'The shape of the card’s corners.', options: CORNERS },
  { key: 'frame', title: 'Edge', hint: 'The line around the card.', options: FRAMES },
]

export default function FinishPanel({ design, change, invitation }: PanelProps) {
  const resolved = resolveLook(design.template, design.look)
  const setLook = (patch: Partial<InvitationLook>) => change((d) => ({ ...d, look: { ...d.look, ...patch } }))

  return (
    <>
      {GROUPS.map((g) => (
        <PanelSection key={g.key} title={g.title} hint={g.hint}>
          <fieldset className="studio-tiles">
            <legend className="visually-hidden">{g.title}</legend>
            {Object.entries(g.options).map(([value, label]) => {
              // Each tile is a tiny card in the couple's own palette with just this one choice changed.
              const attrs = inviteAttrs({ ...invitation, ...design, look: { ...design.look, [g.key]: value } })
              return (
                <label key={value} className="studio-tile">
                  <input
                    type="radio"
                    className="visually-hidden"
                    name={`finish-${g.key}`}
                    checked={resolved[g.key] === value}
                    onChange={() => setLook({ [g.key]: value })}
                  />
                  <span className="inv studio-tile-preview" {...attrs} aria-hidden="true">
                    <span className="inv-card" />
                  </span>
                  <span>{label}</span>
                </label>
              )
            })}
          </fieldset>
        </PanelSection>
      ))}

      <button
        type="button"
        className="btn btn--secondary btn--block"
        onClick={() => setLook({ texture: null, corners: null, frame: null })}
      >
        Reset to {templateOf(design.template).label} finish
      </button>
    </>
  )
}
