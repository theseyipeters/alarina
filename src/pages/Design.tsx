import { useState } from 'react'
import { Link } from 'react-router'
import InvitationCard from '../invite/InvitationCard.tsx'
import RsvpForm from '../invite/RsvpForm.tsx'
import { inviteAttrs, PALETTES, TEMPLATES, type Palette, type Template } from '../invite/design.ts'
import '../invite/styles.ts'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import type { Wedding } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import './Design.css'
import Logo from '../components/Logo.tsx'
import { STUDIO_QUERY } from '../lib/studio.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'

type Device = 'phone' | 'desktop'

export default function Design() {
  useTitle('Design your invitation')
  const [state, setWedding, retry] = useWedding()
  const studio = useMediaQuery(STUDIO_QUERY)
  const [device, setDevice] = useState<Device>('phone')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'loading') return <Loading page />
  if (state.status === 'error') {
    return (
      <main id="main" className="page">
        <LoadError title="Your invitation didn’t load" message={state.message} onRetry={retry}>
          <Link to="/app">Back to overview</Link>
        </LoadError>
      </main>
    )
  }
  if (!state.wedding) {
    return (
      <main id="main" className="page">
        <EmptyState card icon="list" title="Set up your wedding first" action={<Link to="/app/setup" className="btn">Go to setup</Link>}>
          Your invitation needs your names, date and venue before you can design it.
        </EmptyState>
      </main>
    )
  }

  const wedding = state.wedding

  // Applied straight away so the preview never lags; the change goes live on the invitation once saved.
  async function choose(patch: Partial<{ template: Template; palette: Palette }>) {
    setWedding({ ...wedding, ...patch })
    setSaving('saving')
    setError(null)
    try {
      const res = await api.patch<{ wedding: Wedding }>('/wedding', patch)
      setWedding(res.wedding)
      setSaving('saved')
    } catch (err) {
      setWedding(wedding)
      setError(errorMessage(err))
      setSaving('error')
    }
  }

  return (
    <main id="main" className="page page--design">
      <div className="row">
        <Link to="/app" className="brand"><Logo /></Link>
        <p className="save-status" aria-live="polite">
          {saving === 'saving' && 'Saving…'}
          {saving === 'saved' && (wedding.status === 'published' ? 'Saved and live' : 'Saved')}
        </p>
      </div>

      <div className="design-layout">
        <div>
          <h1>Design your invitation</h1>
          <p className="muted">
            Pick a layout and colours. {wedding.status === 'published' ? 'Changes go live straight away.' : 'Guests see it once you publish.'}
          </p>
          {studio && (
            <p className="alert alert--info">
              More layouts, fonts and your own colours are in <Link to="/app/studio">Studio</Link>.
            </p>
          )}
          {error && <p role="alert" className="alert">{error}</p>}

          <fieldset className="options">
            <legend>Layout</legend>
            {TEMPLATES.map((t) => (
              <label key={t.id} className="option">
                <input
                  type="radio"
                  name="template"
                  checked={wedding.template === t.id}
                  onChange={() => choose({ template: t.id })}
                />
                <span>
                  {t.label}
                  <span className="hint">{t.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="options">
            <legend>Colours</legend>
            <div className="swatches">
              {PALETTES.map((p) => (
                <label key={p.id} className="swatch">
                  <input
                    type="radio"
                    name="palette"
                    className="visually-hidden"
                    checked={wedding.palette === p.id}
                    onChange={() => choose({ palette: p.id })}
                  />
                  <span className="swatch-chip" data-palette={p.id} aria-hidden="true">
                    <span />
                  </span>
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="actions">
            {wedding.status === 'published' && wedding.slug ? (
              <a href={`/invite/${wedding.slug}`} target="_blank" rel="noopener" className="btn btn--secondary">
                View live invitation<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            ) : null}
            <Link to="/app" className="btn">Done</Link>
          </div>
        </div>

        <section aria-label="Preview">
          <div className="actions preview-toggle" role="group" aria-label="Preview size">
            {(['phone', 'desktop'] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={d === device ? 'btn' : 'btn btn--secondary'}
                aria-pressed={d === device}
                onClick={() => setDevice(d)}
              >
                {d === 'phone' ? 'Phone' : 'Desktop'}
              </button>
            ))}
          </div>
          <div className={`preview-frame preview-frame--${device}`}>
            <div className="inv inv--preview" {...inviteAttrs(wedding)} inert>
              <div className="inv-column">
                <InvitationCard invitation={wedding} />
                <section className="inv-panel" aria-label="RSVP preview">
                  <h2>RSVP</h2>
                  <RsvpForm submitLabel="Send reply" busyLabel="Sending…" disabled onSubmit={async () => {}} />
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
