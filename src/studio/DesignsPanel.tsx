import { LOOKS, lookDesign, TEMPLATES } from '../invite/design.ts'
import { PanelSection, Thumb } from './parts.tsx'
import type { PanelProps } from './types.ts'

/** Curated looks (layout, colours, fonts and finish together), then every layout on its own. */
export default function DesignsPanel({ design, change, invitation }: PanelProps) {
  return (
    <>
      <PanelSection title="Curated looks" hint="A layout, colours and fonts chosen to go together. You can fine-tune any of it after.">
        <div className="studio-grid">
          {LOOKS.map((look) => {
            const d = lookDesign(look)
            // Keep the couple's own colours so choosing a look never throws them away.
            const apply = () => change({ ...d, look: { ...d.look, colors: design.look.colors } })
            return (
              <button key={look.id} type="button" className="studio-option" onClick={apply}>
                <Thumb invitation={invitation} design={d} id={look.id} />
                <span className="studio-option-label">{look.label}</span>
              </button>
            )
          })}
        </div>
      </PanelSection>

      <PanelSection title="Layouts" hint="Changing the layout keeps your colours, and any fonts or finish you picked yourself.">
        <fieldset className="studio-grid">
          <legend className="visually-hidden">Layout</legend>
          {TEMPLATES.map((t) => (
            <label key={t.id} className="studio-option">
              <input
                type="radio"
                className="visually-hidden"
                name="studio-template"
                checked={design.template === t.id}
                onChange={() => change({ ...design, template: t.id })}
                aria-describedby={`template-${t.id}-hint`}
              />
              <Thumb invitation={invitation} design={{ ...design, template: t.id }} id={t.id} />
              <span className="studio-option-label">{t.label}</span>
              <span className="studio-option-hint" id={`template-${t.id}-hint`}>{t.description}</span>
            </label>
          ))}
        </fieldset>
      </PanelSection>
    </>
  )
}
