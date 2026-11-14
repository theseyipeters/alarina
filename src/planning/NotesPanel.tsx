import { useState, type FormEvent } from 'react'
import Field from '../components/Field.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { ROLE_LABELS, type Note, type PlanningRole } from './types.ts'
import { useLoad } from './useLoad.ts'

/** The planning board's notes. Everyone on the wedding can add one, co-planners included. */
export default function NotesPanel({ weddingId, role }: { weddingId: string; role: PlanningRole }) {
  const [state, reload] = useLoad<{ notes: Note[] }>(`/planning/${weddingId}/notes`)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post(`/planning/${weddingId}/notes`, { body })
      setBody('')
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setError(null)
    try {
      await api.delete(`/planning/${weddingId}/notes/${id}`)
      await reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <section className="card" aria-labelledby="notes-title" data-tour="notes">
      <h2 id="notes-title">Notes</h2>
      {error && <p role="alert" className="alert">{error}</p>}
      <form onSubmit={add}>
        <Field label="Add a note" hint="Everyone planning this wedding can see it.">
          {(p) => <textarea {...p} rows={3} required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />}
        </Field>
        <button className="btn btn--secondary" disabled={busy || !body.trim()}>{busy ? 'Adding…' : 'Add note'}</button>
      </form>
      {state.status === 'ready' && state.data.notes.length > 0 && (
        <ol className="thread-messages">
          {state.data.notes.map((n) => (
            <li key={n.id} className="thread-message">
              <span className="hint">
                {n.authorName} · {ROLE_LABELS[n.authorRole]} · {new Date(n.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
              </span>
              <p>{n.body}</p>
              {(n.mine || role === 'couple') && (
                <button type="button" className="link-button" onClick={() => remove(n.id)}>
                  Delete note
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
