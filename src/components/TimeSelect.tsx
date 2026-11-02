import { useMemo } from 'react'
import { formatTime } from '../lib/format.ts'
import Select from './Select.tsx'

type Props = {
  id?: string
  /** HH:mm, or '' for no time. */
  value: string
  onChange: (value: string) => void
  /** Offer "Not set" as a choice, for times that are optional. */
  optional?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

// Every quarter of an hour: weddings start on the hour or the half hour far more often than not.
const QUARTERS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`)

/** A start time chosen from a list, in the same dropdown style as everything else. */
export default function TimeSelect({ value, onChange, optional, ...rest }: Props) {
  const options = useMemo(() => {
    // A time saved earlier that isn't on the quarter-hour still shows, rather than vanishing.
    const times = value && !QUARTERS.includes(value) ? [...QUARTERS, value].sort() : QUARTERS
    return [...(optional ? [{ value: '', label: 'Not set' }] : []), ...times.map((t) => ({ value: t, label: formatTime(t) }))]
  }, [value, optional])

  return <Select {...rest} value={value} onChange={onChange} options={options} placeholder="Choose a time" />
}
