import { useEffect, useState } from 'react'
import AmountInput from '../components/AmountInput.tsx'
import { Petals } from '../components/Celebration.tsx'
import DatePicker from '../components/DatePicker.tsx'
import Field from '../components/Field.tsx'
import ImageField from '../components/ImageField.tsx'
import Select from '../components/Select.tsx'
import TimeSelect from '../components/TimeSelect.tsx'
import { useTitle } from '../lib/useTitle.ts'
import '@fontsource/instrument-serif'
import './StyleGuide.css'
import Logo from '../components/Logo.tsx'
import { EmptyState, Loading, LoadError } from '../components/States.tsx'

const COLOURS = [
  ['--bg', 'Page background'],
  ['--surface', 'Cards, fields'],
  ['--text', 'Text, headings'],
  ['--text-muted', 'Hints, metadata'],
  ['--border', 'Hairlines'],
  ['--field-border', 'Input outlines'],
  ['--primary', 'Primary button'],
  ['--accent', 'Links, focus'],
  ['--danger', 'Errors'],
  ['--success', 'Confirmations'],
] as const

type Theme = 'auto' | 'light' | 'dark'

/** Development-only reference of every token and component, in light and dark. */
export default function StyleGuide() {
  useTitle('Style guide')
  const [theme, setTheme] = useState<Theme>('auto')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [choice, setChoice] = useState('')
  const [price, setPrice] = useState('1250000')
  const [photo, setPhoto] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = theme
    return () => {
      delete root.dataset.theme
    }
  }, [theme])

  return (
    <main id="main" className="page page--wide">
      <div className="row">
        <span className="brand"><Logo /></span>
        <div className="actions" role="group" aria-label="Theme">
          {(['auto', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={t === theme ? 'btn' : 'btn btn--secondary'}
              aria-pressed={t === theme}
              onClick={() => setTheme(t)}
            >
              {t === 'auto' ? 'Auto' : t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>

      <h1>Style guide</h1>
      <p className="muted">Ink and ivory. Regular weight, a few sizes, lots of space. Rules are in docs/style-guide.md.</p>

      <section className="sg-section" aria-labelledby="sg-type">
        <h2 id="sg-type">Typography</h2>
        <div className="sg-type">
          <div>
            <h1>Ọláolúwa & Ẹniọlá</h1>
            <code>h1 · Bricolage Grotesque · 32px · 600 (semibold: main headings only)</code>
          </div>
          <div>
            <span className="brand"><Logo /></span>
            <code>Logo · DM Serif Display, outlined (components/Logo.tsx)</code>
          </div>
          <div>
            <h2>Your partner</h2>
            <code>h2 · Bricolage Grotesque · 24px · 400</code>
          </div>
          <div>
            <p>We can’t wait to celebrate with you. Answers save as you type, so you can stop and come back.</p>
            <code>Body · Geist · 16px · 400</code>
          </div>
          <div>
            <p className="muted">Sunday, 12 December 2027 · 2:00 pm</p>
            <code>Muted · Geist · 16px · 400</code>
          </div>
          <div>
            <p className="hint">Helps guests find their way.</p>
            <code>Hint · Geist · 14px · 400</code>
          </div>
          <div>
            <p className="eyebrow">Saturday, 12 December</p>
            <code>Eyebrow · Geist · 12px · 400 · uppercase</code>
          </div>
          <div>
            <p>
              Text with a <a href="#sg-type">link</a> and <strong>strong</strong> text, which stays regular weight.
            </p>
            <code>Links use the accent colour; emphasis is never bold</code>
          </div>
          <div>
            <p className="sg-invite">Ọláolúwa & Ẹniọlá</p>
            <code>Invitation heading · Instrument Serif · invitation card only, never in the app</code>
          </div>
        </div>
      </section>

      <section className="sg-section" aria-labelledby="sg-colour">
        <h2 id="sg-colour">Colour</h2>
        <div className="sg-swatches">
          {COLOURS.map(([token, use]) => (
            <div key={token}>
              <div className="sg-swatch" style={{ background: `var(${token})` }} />
              <span className="hint">{use}</span>
              <code>{token}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="sg-section" aria-labelledby="sg-buttons">
        <h2 id="sg-buttons">Buttons</h2>
        <div className="actions">
          <button type="button" className="btn">Publish invitation</button>
          <button type="button" className="btn btn--secondary">Save as private draft</button>
          <button type="button" className="btn" disabled>Publishing…</button>
          <button type="button" className="link-button">Edit</button>
        </div>
        <div className="section">
          <button type="button" className="btn btn--block">Create account</button>
        </div>
      </section>

      <section className="sg-section" aria-labelledby="sg-fields">
        <h2 id="sg-fields">Form fields</h2>
        <div className="sg-grid">
          <div>
            <Field label="Venue name">
              {(p) => <input {...p} type="text" placeholder="Eko Hotel and Suites" />}
            </Field>
            <Field label="Address" optional hint="Helps guests find their way.">
              {(p) => <input {...p} type="text" />}
            </Field>
            <Field label="Wedding date" error="This date has already passed.">
              {(p) => <DatePicker {...p} value="2020-01-01" onChange={() => {}} />}
            </Field>
          </div>
          <div>
            <div className="field-row">
              <Field label="Date" optional>
                {(p) => <DatePicker {...p} clearable value={date} onChange={setDate} />}
              </Field>
              <Field label="Start time" optional>
                {(p) => <TimeSelect {...p} optional value={time} onChange={setTime} />}
              </Field>
            </div>
            <Field label="Price" hint="From ₦500. Guests pay Paystack’s fee on top.">
              {(p) => <AmountInput {...p} min={500} max={50000000} placeholder={85000} value={price} onChange={setPrice} />}
            </Field>
            <ImageField label="Cover photo" value={photo} onChange={setPhoto} />
            <Field label="Bank">
              {(p) => (
                <Select
                  {...p}
                  value={choice}
                  onChange={setChoice}
                  placeholder="Choose your bank"
                  options={['Access Bank', 'GTBank', 'Kuda', 'Zenith Bank'].map((b) => ({ value: b, label: b }))}
                />
              )}
            </Field>
            <Field label="Message to your guests" optional hint="0 of 1000 characters">
              {(p) => <textarea {...p} rows={3} />}
            </Field>
            <p className="save-status">All changes saved</p>
          </div>
        </div>
      </section>

      <section className="sg-section" aria-labelledby="sg-feedback">
        <h2 id="sg-feedback">Feedback</h2>
        <p className="alert">This invite link is invalid or has expired.</p>
        <p className="alert alert--success">Your invitation is published.</p>
        <div className="alert alert--info">
          <p>To publish, you still need:</p>
          <ul>
            <li>Wedding date</li>
            <li>Venue</li>
          </ul>
        </div>
        <div className="actions">
          <span className="badge">Private draft</span>
          <span className="badge badge--live">Published</span>
        </div>
        <h3>Live panel</h3>
        <section className="celebrate">
          <Petals />
          <div className="celebrate-body">
            <p className="eyebrow">Approved</p>
            <h2>Your listing is live</h2>
            <p className="muted">Couples can find you in the marketplace now. Share your page so they can enquire and book.</p>
            <div className="actions">
              <button type="button" className="btn">Share on WhatsApp</button>
              <button type="button" className="btn btn--secondary">See your page</button>
            </div>
          </div>
        </section>
        <h3>Empty, failed and loading</h3>
        <div className="stack">
          <EmptyState card icon="envelope" title="No replies yet" action={<button type="button" className="btn">Share your invitation</button>}>
            Replies appear here as guests answer, marked with your side or your partner’s.
          </EmptyState>
          <EmptyState card compact icon="store" title="No vendors yet" action={<button type="button" className="btn btn--secondary">Add a vendor</button>}>
            Add the ones you already know, or find them in the marketplace.
          </EmptyState>
          <LoadError title="Your budget didn’t load" message="Could not reach the server. Check your connection and try again." onRetry={() => new Promise((r) => setTimeout(r, 800))} />
          <div className="card">
            <LoadError compact title="This booking didn’t load" message="Could not reach the server. Check your connection and try again." onRetry={() => new Promise((r) => setTimeout(r, 800))} />
          </div>
          <div className="card">
            <Loading label="Loading your vendors" />
          </div>
        </div>
      </section>

      <section className="sg-section" aria-labelledby="sg-patterns">
        <h2 id="sg-patterns">Patterns</h2>
        <div className="stack">
          <div className="card">
            <div className="row row--tight">
              <span className="badge badge--live">Published</span>
              <button type="button" className="btn btn--secondary">Edit details</button>
            </div>
            <h1>Ọláolúwa & Ẹniọlá</h1>
            <p className="muted">Sunday, 12 December 2027 · 2:00 pm</p>
            <div className="link-box">
              <input type="text" readOnly value="https://alarina.ng/invite/olaoluwa-and-eniola-97pb" aria-label="Invitation link" />
              <button type="button" className="btn btn--secondary">Copy</button>
            </div>
          </div>
          <div className="card">
            <dl className="summary">
              {[
                ['Names', 'Ọláolúwa & Ẹniọlá'],
                ['Venue', 'Eko Hotel and Suites, Victoria Island'],
                ['Dress code', ''],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || <span className="muted">Not added</span>}</dd>
                  <dd className="summary-edit">
                    <button type="button" className="link-button">Edit</button>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </main>
  )
}
