import type { WeddingEvent } from '../lib/types.ts'
import DatePicker from '../components/DatePicker.tsx'
import TimeSelect from '../components/TimeSelect.tsx'
import Field from '../components/Field.tsx'

const MAX_EVENTS = 10

type Props = { events: WeddingEvent[]; onChange: (events: WeddingEvent[]) => void }

export default function EventsEditor({ events, onChange }: Props) {
  const update = (id: string, patch: Partial<WeddingEvent>) =>
    onChange(events.map((e) => (e.id === id ? { ...e, ...patch } : e)))

  const add = () =>
    onChange([
      ...events,
      { id: crypto.randomUUID(), name: '', date: null, startTime: null, venueName: null, venueAddress: null },
    ])

  return (
    <div>
      {events.map((event, i) => (
        <fieldset key={event.id} className="event-card">
          <legend>{event.name.trim() || `Event ${i + 1}`}</legend>
          <Field label="Event name" hint={event.name.trim() ? undefined : 'Give the event a name to save it.'}>
            {(p) => (
              <input
                {...p}
                type="text"
                maxLength={80}
                placeholder="Traditional engagement"
                value={event.name}
                onChange={(e) => update(event.id, { name: e.target.value })}
              />
            )}
          </Field>
          <div className="field-row">
            <Field label="Date" optional>
              {(p) => (
                <DatePicker {...p} clearable value={event.date ?? ''} onChange={(date) => update(event.id, { date: date || null })} />
              )}
            </Field>
            <Field label="Start time" optional>
              {(p) => (
                <TimeSelect {...p} optional value={event.startTime ?? ''} onChange={(time) => update(event.id, { startTime: time || null })} />
              )}
            </Field>
          </div>
          <Field label="Venue" optional>
            {(p) => (
              <input {...p} type="text" maxLength={120} placeholder="Family house, Ibadan" value={event.venueName ?? ''} onChange={(e) => update(event.id, { venueName: e.target.value })} />
            )}
          </Field>
          <Field label="Address" optional>
            {(p) => (
              <input {...p} type="text" maxLength={200} placeholder="12 Ring Road, Ibadan" value={event.venueAddress ?? ''} onChange={(e) => update(event.id, { venueAddress: e.target.value })} />
            )}
          </Field>
          <button type="button" className="btn btn--secondary" onClick={() => onChange(events.filter((e) => e.id !== event.id))}>
            Remove {event.name.trim() || `event ${i + 1}`}
          </button>
        </fieldset>
      ))}
      {events.length < MAX_EVENTS && (
        <button type="button" className="btn btn--secondary" onClick={add}>
          {events.length ? 'Add another event' : 'Add an event'}
        </button>
      )}
    </div>
  )
}
