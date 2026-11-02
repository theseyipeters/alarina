import type { ReactNode } from 'react'
import InvitationCard from '../invite/InvitationCard.tsx'
import { inviteAttrs, type Design } from '../invite/design.ts'
import type { InvitationContent } from '../lib/types.ts'

/** A titled group of controls inside a Studio panel. */
export function PanelSection({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="studio-section">
      <div className="studio-section-head">
        <h3>{title}</h3>
        {action}
      </div>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </section>
  )
}

/**
 * The couple's real invitation in a given design, shrunk to a thumbnail. Decorative: the
 * control around it carries the name.
 */
export function Thumb({ invitation, design, id }: { invitation: InvitationContent; design: Design; id: string }) {
  const w = { ...invitation, ...design }
  return (
    <span className="studio-thumb" aria-hidden="true">
      <span className="inv inv--thumb" {...inviteAttrs(w)} inert>
        <InvitationCard invitation={w} idPrefix={`thumb-${id}`} />
      </span>
    </span>
  )
}

type Option<T extends string> = { value: T; label: string }

/** A row of mutually exclusive choices, as radio buttons styled like a segmented control. */
export function Segmented<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string
  legend: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="studio-seg-field">
      <legend className="visually-hidden">{legend}</legend>
      <div className="studio-seg">
        {options.map((o) => (
          <label key={o.value}>
            <input
              type="radio"
              className="visually-hidden"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
