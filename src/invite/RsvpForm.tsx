import { useState, type FormEvent } from 'react'
import Field from '../components/Field.tsx'

export type RsvpValues = { name: string; email: string; phone: string; attending: boolean | null; partySize: number }

type Props = {
  initial?: Partial<RsvpValues>
  /** On the edit page the email identifies the reply, so it's shown but can't be changed. */
  emailLocked?: boolean
  submitLabel: string
  busyLabel: string
  disabled?: boolean
  /** How many people a reply can bring. Above 1, guests choose how many of them are coming. */
  maxParty?: number
  onSubmit: (values: RsvpValues & { attending: boolean }) => Promise<void>
}

export default function RsvpForm({ initial, emailLocked, submitLabel, busyLabel, disabled, maxParty = 1, onSubmit }: Props) {
  const [values, setValues] = useState<RsvpValues>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    attending: initial?.attending ?? null,
    partySize: Math.min(initial?.partySize ?? 1, Math.max(maxParty, initial?.partySize ?? 1)),
  })
  const [choiceError, setChoiceError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof RsvpValues>(key: K, value: RsvpValues[K]) => setValues((v) => ({ ...v, [key]: value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (values.attending === null) {
      setChoiceError('Choose whether you’ll attend.')
      return
    }
    setBusy(true)
    try {
      // Someone who can't come brings nobody.
      await onSubmit({ ...values, attending: values.attending, partySize: values.attending ? values.partySize : 1 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset className="choices" aria-describedby={choiceError ? 'attending-error' : undefined}>
        <legend>Will you attend?</legend>
        <label className="choice">
          <input
            type="radio"
            name="attending"
            checked={values.attending === true}
            onChange={() => {
              set('attending', true)
              setChoiceError(null)
            }}
            disabled={disabled}
          />
          Joyfully accept
        </label>
        <label className="choice">
          <input
            type="radio"
            name="attending"
            checked={values.attending === false}
            onChange={() => {
              set('attending', false)
              setChoiceError(null)
            }}
            disabled={disabled}
          />
          Regretfully decline
        </label>
        {choiceError && <span id="attending-error" role="alert" className="field-error">{choiceError}</span>}
      </fieldset>

      {values.attending === true && (maxParty > 1 || values.partySize > 1) && (
        <Field label="How many of you are coming?" hint={`Including you. Up to ${Math.max(maxParty, values.partySize)}. Each person gets a seat.`}>
          {(p) => (
            <select {...p} value={values.partySize} onChange={(e) => set('partySize', Number(e.target.value))} disabled={disabled}>
              {Array.from({ length: Math.max(maxParty, values.partySize) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n === 1 ? 'Just me' : `${n} people`}</option>
              ))}
            </select>
          )}
        </Field>
      )}

      <Field label="Your name">
        {(p) => (
          <input {...p} type="text" autoComplete="name" required maxLength={80} placeholder="Chidi Okeke" value={values.name} onChange={(e) => set('name', e.target.value)} disabled={disabled} />
        )}
      </Field>
      {emailLocked ? (
        <Field label="Email" hint="Your reply is linked to this email, so it can’t be changed.">
          {(p) => <input {...p} type="email" value={values.email} readOnly />}
        </Field>
      ) : (
        <Field label="Email" hint="Used only by the couple, and to send you a link to change your reply.">
          {(p) => (
            <input {...p} type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={values.email} onChange={(e) => set('email', e.target.value)} disabled={disabled} />
          )}
        </Field>
      )}
      <Field label="Phone number" hint="Only the couple can see this.">
        {(p) => (
          <input
            {...p}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            pattern="\+?[0-9][0-9 \(\)\-]{6,19}"
            placeholder="0801 234 5678"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            disabled={disabled}
          />
        )}
      </Field>

      <button className="btn btn--block" disabled={busy || disabled}>{busy ? busyLabel : submitLabel}</button>
    </form>
  )
}
