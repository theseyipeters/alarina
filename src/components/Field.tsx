import { useId, type ReactNode } from 'react'

type ControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }

type Props = {
  label: string
  hint?: ReactNode
  error?: string | null
  optional?: boolean
  children: (props: ControlProps) => ReactNode
}

/** Label, hint and error wired to the control for screen readers. */
export default function Field({ label, hint, error, optional, children }: Props) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="muted"> (optional)</span>}
      </label>
      {children({ id, ...(describedBy && { 'aria-describedby': describedBy }), ...(error && { 'aria-invalid': true as const }) })}
      {hint && <span id={hintId} className="hint">{hint}</span>}
      {error && <span id={errorId} className="field-error">{error}</span>}
    </div>
  )
}
