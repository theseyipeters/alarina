import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import DatePicker from '../components/DatePicker.tsx'
import TimeSelect from '../components/TimeSelect.tsx'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import Field from '../components/Field.tsx'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatDate, formatTime, todayInLagos } from '../lib/format.ts'
import type { Wedding, WeddingEvent, WeddingFields } from '../lib/types.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import EventsEditor from '../setup/EventsEditor.tsx'
import { FIELD_STEP, REQUIRED, STEP_FIELDS, STEPS, stepIndex, type StepId } from '../setup/steps.ts'
import { useAutosave, type SaveStatus } from '../setup/useAutosave.ts'
import Logo from '../components/Logo.tsx'

// The live preview pulls in the invitation fonts and styles, so it loads only on wide screens.
const LivePreview = lazy(() => import('../setup/LivePreview.tsx'))

const EMPTY: WeddingFields = {
  partnerOneName: null,
  partnerTwoName: null,
  partnerOneFamily: null,
  partnerTwoFamily: null,
  date: null,
  startTime: null,
  venueName: null,
  venueAddress: null,
  dressNote: null,
  message: null,
  rsvpDeadline: null,
  events: [],
}

export default function Setup() {
  useTitle('Set up your wedding')
  const [state, setWedding] = useWedding()
  const { state: auth } = useAuth()

  if (state.status === 'loading' || auth.status !== 'signedIn') return <p className="page muted">Loading…</p>
  if (state.status === 'error') {
    return (
      <main id="main" className="page">
        <p role="alert" className="alert">Your wedding details couldn’t be loaded. Refresh the page to try again.</p>
      </main>
    )
  }

  // A brand-new setup starts with the two account names, which the couple can change.
  const defaults: Partial<WeddingFields> = state.wedding
    ? {}
    : { partnerOneName: auth.user.name, partnerTwoName: auth.couple.partner?.name ?? null }

  return <Wizard wedding={state.wedding} defaults={defaults} onSaved={setWedding} />
}

type WizardProps = {
  wedding: Wedding | null
  defaults: Partial<WeddingFields>
  onSaved: (wedding: Wedding) => void
}

function Wizard({ wedding, defaults, onSaved }: WizardProps) {
  const { step } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState<WeddingFields>(() => {
    const fields = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, wedding?.[k as keyof WeddingFields]]))
    return { ...EMPTY, ...defaults, ...(wedding && (fields as Partial<WeddingFields>)) }
  })
  // Tracked locally so moving forward isn't held up waiting for the save to come back.
  const [reached, setReached] = useState(wedding?.checkpoint ?? 0)
  const { status, change, flush } = useAutosave(onSaved)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const wide = useMediaQuery('(min-width: 80rem)')

  // Move focus to the new question so screen reader users hear it when the step changes.
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const index = stepIndex(step)
  const furthest = Math.min(reached, STEPS.length - 1)
  if (index === -1 || index > furthest) return <Navigate to={`/app/setup/${STEPS[furthest]!.id}`} replace />
  const current = STEPS[index]!

  const set = <K extends keyof WeddingFields>(key: K, value: WeddingFields[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    // Unnamed events are kept on screen but not saved until they have a name.
    const saved = key === 'events' ? (value as WeddingEvent[]).filter((e) => e.name.trim()) : value
    change({ [key]: saved })
  }

  const go = (to: StepId) => navigate(`/app/setup/${to}`)

  function next(e: FormEvent) {
    e.preventDefault()
    const target = index + 1
    setReached((r) => Math.max(r, target))
    const own = Object.fromEntries(STEP_FIELDS[current.id].map((k) => [k, values[k]])) as Partial<WeddingFields>
    if (own.events) own.events = own.events.filter((ev) => ev.name.trim())
    flush({ ...own, checkpoint: target }).catch(() => {})
    go(STEPS[target]!.id)
  }

  const text = (key: keyof WeddingFields) => (values[key] as string | null) ?? ''
  const today = todayInLagos()

  let body: ReactNode
  switch (current.id) {
    case 'names':
      body = (
        <>
          <Field label="First partner’s name">
            {(p) => <input {...p} type="text" autoComplete="off" maxLength={60} placeholder="Ọláolúwa" value={text('partnerOneName')} onChange={(e) => set('partnerOneName', e.target.value)} />}
          </Field>
          <Field label="Second partner’s name">
            {(p) => <input {...p} type="text" autoComplete="off" maxLength={60} placeholder="Ẹniọlá" value={text('partnerTwoName')} onChange={(e) => set('partnerTwoName', e.target.value)} />}
          </Field>
        </>
      )
      break
    case 'families':
      body = (
        <>
          <Field label="First partner’s family" optional>
            {(p) => <input {...p} type="text" maxLength={80} placeholder="The Adébáyọ̀ family" value={text('partnerOneFamily')} onChange={(e) => set('partnerOneFamily', e.target.value)} />}
          </Field>
          <Field label="Second partner’s family" optional>
            {(p) => <input {...p} type="text" maxLength={80} placeholder="The Okafor family" value={text('partnerTwoFamily')} onChange={(e) => set('partnerTwoFamily', e.target.value)} />}
          </Field>
        </>
      )
      break
    case 'date':
      body = (
        <Field label="Wedding date" error={values.date && values.date < today ? 'This date has already passed.' : null}>
          {(p) => <DatePicker {...p} min={today} value={text('date')} onChange={(date) => set('date', date || null)} />}
        </Field>
      )
      break
    case 'time':
      body = (
        <Field label="Start time" hint="Nigerian time (WAT).">
          {(p) => <TimeSelect {...p} value={text('startTime')} onChange={(time) => set('startTime', time || null)} />}
        </Field>
      )
      break
    case 'venue':
      body = (
        <>
          <Field label="Venue name">
            {(p) => <input {...p} type="text" maxLength={120} placeholder="Eko Hotel and Suites" value={text('venueName')} onChange={(e) => set('venueName', e.target.value)} />}
          </Field>
          <Field label="Address" optional hint="Helps guests find their way.">
            {(p) => <input {...p} type="text" maxLength={200} placeholder="Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos" value={text('venueAddress')} onChange={(e) => set('venueAddress', e.target.value)} />}
          </Field>
        </>
      )
      break
    case 'dress':
      body = (
        <Field label="Dress code" optional hint="Colours for aso-ebi, black tie, or anything guests should know.">
          {(p) => <input {...p} type="text" maxLength={200} placeholder="Aso-ebi in emerald and gold" value={text('dressNote')} onChange={(e) => set('dressNote', e.target.value)} />}
        </Field>
      )
      break
    case 'message':
      body = (
        <Field label="Message to your guests" optional hint={`${text('message').length} of 1000 characters`}>
          {(p) => <textarea {...p} rows={6} maxLength={1000} placeholder="We can’t wait to celebrate with you." value={text('message')} onChange={(e) => set('message', e.target.value)} />}
        </Field>
      )
      break
    case 'rsvp':
      body = (
        <Field
          label="RSVP by"
          optional
          hint="Guests can’t send new RSVPs after this date. Leave it empty to accept RSVPs until the day."
          error={values.rsvpDeadline && values.date && values.rsvpDeadline > values.date ? 'Choose a date on or before the wedding.' : null}
        >
          {(p) => <DatePicker {...p} clearable min={today} max={values.date ?? undefined} value={text('rsvpDeadline')} onChange={(date) => set('rsvpDeadline', date || null)} />}
        </Field>
      )
      break
    case 'events':
      body = <EventsEditor events={values.events} onChange={(events) => set('events', events)} />
      break
    case 'finish':
      body = <Review values={values} flush={flush} onEdit={go} />
      break
  }

  return (
    <main id="main" className="page page--setup">
      <div className="row">
        <Link to="/app" className="brand"><Logo /></Link>
        <SaveIndicator status={status} retry={() => flush().catch(() => {})} />
      </div>

      <div className="setup-layout">
        <StepNav currentIndex={index} furthest={furthest} />

        <div className="card">
          <h1 ref={headingRef} tabIndex={-1} className="step-heading">{QUESTIONS[current.id]}</h1>
          {current.id === 'finish' ? (
            body
          ) : (
            <form onSubmit={next}>
              {body}
              <div className="actions actions--end">
                {index > 0 && (
                  <button type="button" className="btn btn--secondary actions__back" onClick={() => go(STEPS[index - 1]!.id)}>Back</button>
                )}
                <button className="btn">{current.id === 'events' ? 'Review' : 'Continue'}</button>
              </div>
            </form>
          )}
        </div>

        {wide && (
          <Suspense fallback={<div className="live-preview" />}>
            <LivePreview
              values={values}
              design={{ template: wedding?.template ?? 'classic', palette: wedding?.palette ?? 'ivory', look: wedding?.look }}
              step={current.id}
            />
          </Suspense>
        )}
      </div>
    </main>
  )
}

const QUESTIONS: Record<StepId, string> = {
  names: 'What are your names?',
  families: 'Which families are hosting?',
  date: 'When is the wedding?',
  time: 'What time does it start?',
  venue: 'Where is it?',
  dress: 'Is there a dress code?',
  message: 'Anything you’d like to say to your guests?',
  rsvp: 'When should guests reply by?',
  events: 'Are there other events?',
  finish: 'Review your invitation',
}

function SaveIndicator({ status, retry }: { status: SaveStatus; retry: () => void }) {
  return (
    <p className="save-status" aria-live="polite">
      {status === 'pending' || status === 'saving' ? 'Saving…' : null}
      {status === 'saved' ? 'All changes saved' : null}
      {status === 'error' ? (
        <span className="field-error">
          Not saved.{' '}
          <button type="button" className="link-button" onClick={retry}>Try again</button>
        </span>
      ) : null}
    </p>
  )
}

/** Steps you've reached are links; later ones are plain text until you get there. */
function StepList({ currentIndex, furthest }: { currentIndex: number; furthest: number }) {
  return (
    <ol>
      {STEPS.map((s, i) => (
        <li key={s.id}>
          {i <= furthest ? (
            <Link to={`/app/setup/${s.id}`} aria-current={i === currentIndex ? 'step' : undefined}>{s.label}</Link>
          ) : (
            <span className="muted">{s.label}</span>
          )}
        </li>
      ))}
    </ol>
  )
}

/** Collapsible step list on phones; an always-visible sidebar on wide screens (only one shows). */
function StepNav({ currentIndex, furthest }: { currentIndex: number; furthest: number }) {
  const count = `Step ${currentIndex + 1} of ${STEPS.length}`
  const progress = (
    <div className="progress" aria-hidden="true">
      <span style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }} />
    </div>
  )

  return (
    <>
      <details className="steps-nav">
        <summary>
          {count} · {STEPS[currentIndex]!.label}
        </summary>
        <nav aria-label="Setup steps">
          <StepList currentIndex={currentIndex} furthest={furthest} />
        </nav>
        {progress}
      </details>
      <nav className="steps-rail" aria-label="Setup steps">
        <p className="steps-rail-count">{count}</p>
        {progress}
        <StepList currentIndex={currentIndex} furthest={furthest} />
      </nav>
    </>
  )
}

type ReviewProps = { values: WeddingFields; flush: () => Promise<void>; onEdit: (step: StepId) => void }

function Review({ values, flush, onEdit }: ReviewProps) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState<'publish' | 'draft' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [problems, setProblems] = useState<Record<string, string>>({})

  const missing = REQUIRED.filter((r) => !String(values[r.field] ?? '').trim())

  async function finish(publish: boolean) {
    setBusy(publish ? 'publish' : 'draft')
    setError(null)
    setProblems({})
    try {
      await flush()
      await api.post(publish ? '/wedding/publish' : '/wedding/finish')
      navigate('/app', { replace: true, state: { justFinished: publish ? 'published' : 'draft' } })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_ready') {
        setProblems((err.details as { problems: Record<string, string> }).problems)
      } else {
        setError(errorMessage(err))
      }
      setBusy(null)
    }
  }

  const rows: { label: string; value: ReactNode; step: StepId }[] = [
    { label: 'Names', value: [values.partnerOneName, values.partnerTwoName].filter(Boolean).join(' & '), step: 'names' },
    { label: 'Families', value: [values.partnerOneFamily, values.partnerTwoFamily].filter(Boolean).join(' and '), step: 'families' },
    { label: 'Date', value: formatDate(values.date), step: 'date' },
    { label: 'Start time', value: formatTime(values.startTime), step: 'time' },
    { label: 'Venue', value: [values.venueName, values.venueAddress].filter(Boolean).join(', '), step: 'venue' },
    { label: 'Dress code', value: values.dressNote, step: 'dress' },
    { label: 'Message', value: values.message, step: 'message' },
    { label: 'RSVP by', value: formatDate(values.rsvpDeadline), step: 'rsvp' },
    {
      label: 'Other events',
      value: values.events.filter((e) => e.name.trim()).map((e) => e.name).join(', '),
      step: 'events',
    },
  ]

  const problemList = Object.entries(problems)

  return (
    <>
      <p className="muted">Publishing makes your invitation visible to anyone with its link. A private draft stays hidden until you publish.</p>

      {missing.length > 0 && (
        <div className="alert alert--info">
          <p>To publish, you still need:</p>
          <ul>
            {missing.map((m) => (
              <li key={m.field}>
                <button type="button" className="link-button" onClick={() => onEdit(m.step)}>{m.label}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {problemList.length > 0 && (
        <div role="alert" className="alert">
          <p>Fix these before publishing:</p>
          <ul>
            {problemList.map(([field, message]) => (
              <li key={field}>
                {FIELD_STEP[field] ? (
                  <button type="button" className="link-button" onClick={() => onEdit(FIELD_STEP[field]!)}>{message}</button>
                ) : (
                  message
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="alert">{error}</p>}

      <dl className="summary">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value || <span className="muted">Not added</span>}</dd>
            <dd className="summary-edit">
              <button type="button" className="link-button" onClick={() => onEdit(row.step)}>
                Edit<span className="visually-hidden"> {row.label.toLowerCase()}</span>
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <div className="actions actions--end">
        <button type="button" className="btn btn--secondary actions__back" onClick={() => onEdit('events')}>Back</button>
        <button type="button" className="btn btn--secondary" onClick={() => finish(false)} disabled={busy !== null}>
          {busy === 'draft' ? 'Saving…' : 'Save as private draft'}
        </button>
        <button type="button" className="btn" onClick={() => finish(true)} disabled={busy !== null}>
          {busy === 'publish' ? 'Publishing…' : 'Publish invitation'}
        </button>
      </div>
    </>
  )
}
