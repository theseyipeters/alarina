import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import DatePicker from '../components/DatePicker.tsx'
import TimeSelect from '../components/TimeSelect.tsx'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import ConfirmNames from '../components/ConfirmNames.tsx'
import Field from '../components/Field.tsx'
import NameInput from '../components/NameInput.tsx'
import { api, ApiError } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatDate, formatTime, todayInLagos } from '../lib/format.ts'
import { PARENT_SIDES, parentSides, parentsText, ROLE_LABELS } from '../invite/parents.ts'
import type { ParentField, Role, Wedding, WeddingEvent, WeddingFields } from '../lib/types.ts'
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
  partnerOneRole: null,
  partnerTwoRole: null,
  hashtag: null,
  partnerOneFamily: null,
  partnerTwoFamily: null,
  partnerOneFather: null,
  partnerOneMother: null,
  partnerTwoFather: null,
  partnerTwoMother: null,
  lateParents: [],
  date: null,
  startTime: null,
  venueName: null,
  venueAddress: null,
  ceremonyName: null,
  receptionSeparate: false,
  receptionName: null,
  receptionVenueName: null,
  receptionVenueAddress: null,
  receptionTime: null,
  dressNote: null,
  message: null,
  rsvpDeadline: null,
  maxPartySize: 1,
  contactPhoneOne: null,
  contactPhoneTwo: null,
  strictlyByInvitation: true,
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

  // Parents replace the older one-line family names, so those are cleared once a parent is named.
  const setParent = (field: ParentField, name: string) => {
    set(field, name)
    if (name.trim()) for (const key of ['partnerOneFamily', 'partnerTwoFamily'] as const) if (values[key]) set(key, null)
  }

  // Choosing one partner's role fills in the other's, unless the couple already set it.
  const setRole = (index: number, role: Role) => {
    const [own, other] = index === 0 ? (['partnerOneRole', 'partnerTwoRole'] as const) : (['partnerTwoRole', 'partnerOneRole'] as const)
    set(own, role)
    if (!values[other]) set(other, role === 'bride' ? 'groom' : 'bride')
  }

  // An event the couple added on the wedding day (before the day had a ceremony and a reception)
  // can become either one. As the ceremony, the venue they had becomes the reception.
  const sameDay = values.date ? values.events.filter((e) => e.name.trim() && e.date === values.date && e.venueName) : []
  const moveEventTo = (event: WeddingEvent, as: 'ceremony' | 'reception') => {
    if (as === 'ceremony') {
      if (values.venueName && !(values.receptionSeparate && values.receptionVenueName)) {
        set('receptionSeparate', true)
        set('receptionVenueName', values.venueName)
        set('receptionVenueAddress', values.venueAddress)
        set('receptionTime', values.startTime)
        set('receptionName', values.ceremonyName)
      }
      set('ceremonyName', event.name)
      set('venueName', event.venueName)
      set('venueAddress', event.venueAddress)
      if (event.startTime) set('startTime', event.startTime)
    } else {
      set('receptionSeparate', true)
      set('receptionVenueName', event.venueName)
      set('receptionVenueAddress', event.venueAddress)
      set('receptionTime', event.startTime)
      set('receptionName', event.name)
    }
    set('events', values.events.filter((e) => e.id !== event.id))
  }
  const sameDayNotice = sameDay.map((event) => (
    <div key={event.id} className="alert alert--info same-day">
      <p>
        “{event.name}” is on your wedding day, under Other days. Move it here so guests see it with the rest of the day.
      </p>
      <div className="actions">
        <button type="button" className="btn btn--secondary" onClick={() => moveEventTo(event, 'ceremony')}>Use as the ceremony</button>
        <button type="button" className="btn btn--secondary" onClick={() => moveEventTo(event, 'reception')}>Use as the reception</button>
      </div>
    </div>
  ))

  const setLate = (field: ParentField, late: boolean) =>
    set('lateParents', late ? [...values.lateParents, field] : values.lateParents.filter((f) => f !== field))

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
            {(p) => <NameInput {...p} label="First partner’s name" maxLength={60} placeholder="Ọláolúwa" value={text('partnerOneName')} onChange={(name) => set('partnerOneName', name)} />}
          </Field>
          <Field label="Second partner’s name">
            {(p) => <NameInput {...p} label="Second partner’s name" maxLength={60} placeholder="Ẹniọlá" value={text('partnerTwoName')} onChange={(name) => set('partnerTwoName', name)} />}
          </Field>
          <Field label="Wedding hashtag" optional hint="Guests can tag their photos with it. Letters, numbers and apostrophes, no spaces.">
            {(p) => (
              <div className="prefix-field">
                <span aria-hidden="true">#</span>
                <input
                  {...p}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={40}
                  placeholder="OlaAndEni2027"
                  value={text('hashtag')}
                  onChange={(e) => set('hashtag', cleanHashtag(e.target.value))}
                />
              </div>
            )}
          </Field>
        </>
      )
      break
    case 'families': {
      const legacy = [values.partnerOneFamily, values.partnerTwoFamily].filter(Boolean).join(' & ')
      body = (
        <>
          <p className="muted">Write each name as it should appear, with any title: Chief, Dr, Alhaji, Mrs. Leave out anyone you’d rather not name.</p>
          {legacy && !parentSides(values).length && (
            <p className="alert alert--info">Your invitation now says “{legacy}”. Parents you add here take its place.</p>
          )}
          {PARENT_SIDES.map((side, i) => {
            const partner = values[side.partner]?.trim() || (i === 0 ? 'First partner' : 'Second partner')
            return (
              <fieldset key={side.partner} className="parent-group">
                <legend>{partner}’s parents</legend>
                <RoleChoice name={side.role} partner={partner} value={values[side.role]} onChange={(role) => setRole(i, role)} />
                {(['father', 'mother'] as const).map((role) => (
                  <ParentInput
                    key={role}
                    label={role === 'father' ? 'Father' : 'Mother'}
                    of={partner}
                    placeholder={PARENT_PLACEHOLDERS[i]![role]}
                    value={text(side[role])}
                    late={values.lateParents.includes(side[role])}
                    onName={(name) => setParent(side[role], name)}
                    onLate={(late) => setLate(side[role], late)}
                  />
                ))}
              </fieldset>
            )
          })}
        </>
      )
      break
    }
    case 'date':
      body = (
        <Field label="Wedding date" error={values.date && values.date < today ? 'This date has already passed.' : null}>
          {(p) => <DatePicker {...p} min={today} value={text('date')} onChange={(date) => set('date', date || null)} />}
        </Field>
      )
      break
    case 'ceremony':
      body = (
        <>
          {sameDayNotice}
          <Field label="Event name" optional={!values.receptionSeparate} hint="The name guests see on your invitation.">
            {(p) => <input {...p} type="text" maxLength={EVENT_NAME_MAX} placeholder="Holy Matrimony" value={text('ceremonyName')} onChange={(e) => set('ceremonyName', e.target.value)} />}
          </Field>
          <Field label="Venue name">
            {(p) => <input {...p} type="text" maxLength={120} placeholder="St. Leo’s Catholic Church, Ikeja" value={text('venueName')} onChange={(e) => set('venueName', e.target.value)} />}
          </Field>
          <Field label="Address" optional hint="Helps guests find their way.">
            {(p) => <input {...p} type="text" maxLength={200} placeholder="Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos" value={text('venueAddress')} onChange={(e) => set('venueAddress', e.target.value)} />}
          </Field>
          <Field label="Start time" hint="Nigerian time (WAT).">
            {(p) => <TimeSelect {...p} value={text('startTime')} onChange={(time) => set('startTime', time || null)} />}
          </Field>
        </>
      )
      break
    case 'reception':
      body = (
        <>
          {sameDayNotice}
          <Choice
            legend="Where is the reception?"
            name="receptionSeparate"
            options={RECEPTION_PLACES}
            value={values.receptionSeparate ? 'elsewhere' : 'same'}
            onChange={(place) => set('receptionSeparate', place === 'elsewhere')}
          />
          {values.receptionSeparate ? (
            <>
              <Field label="Event name" hint="The name guests see on your invitation.">
                {(p) => <input {...p} type="text" maxLength={EVENT_NAME_MAX} placeholder="Wedding Reception" value={text('receptionName')} onChange={(e) => set('receptionName', e.target.value)} />}
              </Field>
              <Field label="Reception venue">
                {(p) => <input {...p} type="text" maxLength={120} placeholder="The Civic Centre, Victoria Island" value={text('receptionVenueName')} onChange={(e) => set('receptionVenueName', e.target.value)} />}
              </Field>
              <Field label="Address" optional>
                {(p) => <input {...p} type="text" maxLength={200} placeholder="Ozumba Mbadiwe Avenue, Victoria Island, Lagos" value={text('receptionVenueAddress')} onChange={(e) => set('receptionVenueAddress', e.target.value)} />}
              </Field>
              <Field label="Start time" optional hint="Nigerian time (WAT).">
                {(p) => <TimeSelect {...p} optional value={text('receptionTime')} onChange={(time) => set('receptionTime', time || null)} />}
              </Field>
            </>
          ) : (
            <p className="muted">Guests will see one venue{values.venueName ? `: ${values.venueName}` : ''}.</p>
          )}
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
        <>
          <Field
            label="RSVP by"
            optional
            hint="Guests can’t send new RSVPs after this date. Leave it empty to accept RSVPs until the day."
            error={values.rsvpDeadline && values.date && values.rsvpDeadline > values.date ? 'Choose a date on or before the wedding.' : null}
          >
            {(p) => <DatePicker {...p} clearable min={today} max={values.date ?? undefined} value={text('rsvpDeadline')} onChange={(date) => set('rsvpDeadline', date || null)} />}
          </Field>
          <Field
            label="How many people can each reply bring?"
            hint="Including the guest. Choose 1 if everyone should reply for themselves. Each person gets a seat when you plan the tables."
          >
            {(p) => (
              <select {...p} value={values.maxPartySize} onChange={(e) => set('maxPartySize', Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n === 1 ? '1 (just themselves)' : `Up to ${n}`}</option>
                ))}
              </select>
            )}
          </Field>
          <PhoneField
            label="Phone number"
            hint="For guests to call about directions or anything else. Anyone with your invitation link can see it."
            value={text('contactPhoneOne')}
            onChange={(phone) => set('contactPhoneOne', phone)}
          />
          <PhoneField label="Second phone number" value={text('contactPhoneTwo')} onChange={(phone) => set('contactPhoneTwo', phone)} />
          <label className="check">
            <input type="checkbox" checked={values.strictlyByInvitation} onChange={(e) => set('strictlyByInvitation', e.target.checked)} />
            Show “Strictly by Invitation” on the invitation
          </label>
        </>
      )
      break
    case 'events':
      body = <EventsEditor events={values.events} weddingDate={values.date} onChange={(events) => set('events', events)} />
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
  ceremony: 'Where and when is the ceremony?',
  reception: 'And the reception?',
  dress: 'Is there a dress code?',
  message: 'Anything you’d like to say to your guests?',
  rsvp: 'When and how should guests reply?',
  events: 'Any celebrations on other days?',
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
  const [checking, setChecking] = useState(false)

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
    { label: 'Hashtag', value: values.hashtag && `#${values.hashtag}`, step: 'names' },
    {
      label: 'Parents',
      value: parentsText(values) || [values.partnerOneFamily, values.partnerTwoFamily].filter(Boolean).join(' and '),
      step: 'families',
    },
    { label: 'Date', value: formatDate(values.date), step: 'date' },
    {
      label: 'Ceremony',
      value: [values.ceremonyName, formatTime(values.startTime), values.venueName, values.venueAddress]
        .filter(Boolean)
        .join(' · '),
      step: 'ceremony',
    },
    {
      label: 'Reception',
      value: values.receptionSeparate
        ? [values.receptionName, formatTime(values.receptionTime), values.receptionVenueName, values.receptionVenueAddress].filter(Boolean).join(' · ')
        : 'At the ceremony venue',
      step: 'reception',
    },
    { label: 'Dress code', value: values.dressNote, step: 'dress' },
    { label: 'Message', value: values.message, step: 'message' },
    { label: 'RSVP by', value: formatDate(values.rsvpDeadline), step: 'rsvp' },
    { label: 'Each reply brings', value: values.maxPartySize === 1 ? 'Just the guest' : `Up to ${values.maxPartySize} people`, step: 'rsvp' },
    { label: 'Phone numbers', value: [values.contactPhoneOne, values.contactPhoneTwo].filter(Boolean).join(' · '), step: 'rsvp' },
    { label: 'Strictly by Invitation', value: values.strictlyByInvitation ? 'Shown on the invitation' : 'Not shown', step: 'rsvp' },
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
        {/* With a required answer missing there are no names to check, so the server explains instead. */}
        <button type="button" className="btn" onClick={() => (missing.length ? finish(true) : setChecking(true))} disabled={busy !== null}>
          {busy === 'publish' ? 'Publishing…' : 'Publish invitation'}
        </button>
      </div>

      <ConfirmNames
        open={checking}
        names={values}
        onClose={() => setChecking(false)}
        onEdit={() => onEdit('names')}
        onPublish={() => {
          setChecking(false)
          finish(true)
        }}
      />
    </>
  )
}

const PARENT_PLACEHOLDERS = [
  { father: 'Chief Adébáyọ̀ Ọláolúwa', mother: 'Mrs Fúnmiláyọ̀ Ọláolúwa' },
  { father: 'Mr Chukwuemeka Okafor', mother: 'Mrs Ngozi Okafor' },
]

type ParentInputProps = {
  label: string
  of: string
  placeholder: string
  value: string
  late: boolean
  onName: (name: string) => void
  onLate: (late: boolean) => void
}

/** A parent's name, with a box to mark that they have passed away. */
function ParentInput({ label, of, placeholder, value, late, onName, onLate }: ParentInputProps) {
  return (
    <Field label={label} optional>
      {(p) => (
        <NameInput
          {...p}
          label={`${label} of ${of}`}
          maxLength={80}
          placeholder={placeholder}
          value={value}
          onChange={onName}
          aside={
            <label className="check">
              <input type="checkbox" checked={late} onChange={(e) => onLate(e.target.checked)} />
              Late<span className="visually-hidden"> ({label.toLowerCase()} of {of})</span>
            </label>
          }
        />
      )}
    </Field>
  )
}

/** Bride or groom, for the invitation's captions ("Parents of the Bride"). */
function PhoneField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (phone: string) => void }) {
  const digits = value.replace(/\D/g, '').length
  return (
    <Field label={label} optional hint={hint} error={digits > 0 && digits < PHONE_MIN_DIGITS ? 'Enter a full phone number.' : null}>
      {(p) => <input {...p} type="tel" inputMode="tel" autoComplete="off" maxLength={PHONE_MAX} placeholder="0800 000 0000" value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9+()\s-]/g, ''))} />}
    </Field>
  )
}

function RoleChoice({ name, partner, value, onChange }: { name: string; partner: string; value: Role | null; onChange: (role: Role) => void }) {
  return <Choice legend={`${partner} is the`} name={name} options={ROLE_LABELS} value={value} onChange={onChange} inline />
}

/** Letters, numbers and apostrophes only (phone keyboards type curly ones), and never an apostrophe first. */
const cleanHashtag = (value: string) => value.replace(/[^\p{L}\p{M}\p{N}'’]/gu, '').replace(/^['’]+/, '')

const EVENT_NAME_MAX = 80
const PHONE_MAX = 20
const PHONE_MIN_DIGITS = 7

const RECEPTION_PLACES = { same: 'At the ceremony venue', elsewhere: 'Somewhere else' }

type ChoiceProps<T extends string> = {
  legend: string
  name: string
  options: Record<T, string>
  value: T | null
  onChange: (value: T) => void
  /** Legend and choices on one line, for short options. */
  inline?: boolean
}

/** One answer from a few, as a segmented strip of radios. */
function Choice<T extends string>({ legend, name, options, value, onChange, inline }: ChoiceProps<T>) {
  return (
    <fieldset className={inline ? 'seg-field seg-field--inline' : 'seg-field'}>
      <legend>{legend}</legend>
      <div className="seg">
        {(Object.keys(options) as T[]).map((option) => (
          <label key={option}>
            <input type="radio" className="visually-hidden" name={name} checked={value === option} onChange={() => onChange(option)} />
            {options[option]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
