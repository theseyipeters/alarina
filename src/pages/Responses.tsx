import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router'
import Select from '../components/Select.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { sideLabel } from '../lib/sides.ts'
import type { Response, Responses as ResponsesData } from '../lib/types.ts'
import { useResponses } from '../lib/useResponses.ts'
import { useTitle } from '../lib/useTitle.ts'

type ReplyFilter = 'all' | 'attending' | 'declined'
const NO_SIDE = 'none'

const repliedOn = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

/** Every reply with contact details. A table on wide screens, stacked cards on phones. */
export default function Responses() {
  useTitle('Responses')
  const [state, setState] = useResponses()
  const [reply, setReply] = useState<ReplyFilter>('all')
  const [side, setSide] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<Response | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<{ trigger: HTMLElement; rsvpId: string } | null>(null)

  const data = state.status === 'ready' ? state.data : null

  const visible = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.rsvps.filter(
      (r) =>
        (reply === 'all' || r.attending === (reply === 'attending')) &&
        (side === 'all' || (side === NO_SIDE ? !r.sideUserId : r.sideUserId === side)) &&
        (!q || [r.name, r.email, r.phone].some((v) => v.toLowerCase().includes(q))),
    )
  }, [data, reply, side, query])

  if (state.status === 'loading') return <p className="muted">Loading replies…</p>
  if (state.status === 'error') return <p role="alert" className="alert">Replies couldn’t be loaded. Refresh to try again.</p>
  if (state.status === 'none' || !data) {
    return (
      <div className="card">
        <h1>No replies yet</h1>
        <p className="muted">Set up and publish your invitation to start collecting replies.</p>
        <Link to="/app/setup" className="btn">Set up your wedding</Link>
      </div>
    )
  }

  const replace = (updated: Response) =>
    setState({ status: 'ready', data: { ...data, rsvps: data.rsvps.map((r) => (r.id === updated.id ? updated : r)) } })

  async function changeSide(r: Response, value: string) {
    setError(null)
    const sideUserId = value === NO_SIDE ? null : value
    replace({ ...r, sideUserId, sideSource: sideUserId ? 'couple' : null })
    try {
      replace((await api.patch<{ rsvp: Response }>(`/wedding/rsvps/${r.id}`, { sideUserId })).rsvp)
    } catch (err) {
      replace(r)
      setError(errorMessage(err))
    }
  }

  function askRevoke(r: Response, trigger: HTMLElement) {
    returnFocusRef.current = { trigger, rsvpId: r.id }
    setRevoking(r)
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  async function confirmRevoke() {
    if (!revoking) return
    setError(null)
    try {
      const { rsvp } = await api.post<{ rsvp: Response }>(`/wedding/rsvps/${revoking.id}/revoke-link`)
      // The Revoke button disappears with this update, so focus moves to the guest's name.
      flushSync(() => replace(rsvp))
      closeDialog()
      document.getElementById(`guest-${rsvp.id}`)?.focus()
    } catch (err) {
      setError(errorMessage(err))
      closeDialog()
    }
  }

  const { summary } = data

  return (
    <div className="stack">
      <div className="row row--tight">
        <h1>Responses</h1>
        {data.rsvps.length > 0 && (
          <button type="button" className="btn btn--secondary" onClick={() => downloadCsv(data)}>
            Download CSV
          </button>
        )}
      </div>
      <p className="muted">
        {summary.total} {summary.total === 1 ? 'reply' : 'replies'} · {summary.attending} attending · {summary.declined}{' '}
        declined
      </p>

      {error && <p role="alert" className="alert">{error}</p>}

      {data.rsvps.length === 0 ? (
        <div className="card">
          <h2>No replies yet</h2>
          <p className="muted">
            Replies appear here as guests respond. <Link to="/app/share">Share your invitation</Link> to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="filters">
            <div className="actions" role="group" aria-label="Filter by reply">
              {(['all', 'attending', 'declined'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={f === reply ? 'btn' : 'btn btn--secondary'}
                  aria-pressed={f === reply}
                  onClick={() => setReply(f)}
                >
                  {f === 'all' ? 'All' : f === 'attending' ? 'Attending' : 'Declined'}
                </button>
              ))}
            </div>
            <label className="visually-hidden" htmlFor="side-filter">Filter by side</label>
            <Select
              id="side-filter"
              value={side}
              onChange={setSide}
              options={[
                { value: 'all', label: 'All sides' },
                ...data.partners.map((p) => ({ value: p.userId, label: sideLabel(data.partners, p.userId) })),
                { value: NO_SIDE, label: 'Side not set' },
              ]}
            />
            <label className="visually-hidden" htmlFor="search">Search replies</label>
            <input
              id="search"
              type="search"
              placeholder="Search by name, email or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <p className="visually-hidden" aria-live="polite">
            Showing {visible.length} of {data.rsvps.length} replies
          </p>

          {visible.length === 0 ? (
            <p className="muted">No replies match these filters.</p>
          ) : (
            <table className="responses">
              <thead>
                <tr>
                  <th scope="col">Guest</th>
                  <th scope="col">Reply</th>
                  <th scope="col">Side</th>
                  <th scope="col">Replied</th>
                  <th scope="col">
                    <span className="visually-hidden">Edit link</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="responses-guest" id={`guest-${r.id}`} tabIndex={-1}>
                      {r.name}
                      <a href={`mailto:${r.email}`}>{r.email}</a>
                      <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{r.phone}</a>
                    </th>
                    <td data-label="Reply">
                      <span className={r.attending ? 'badge badge--live' : 'badge'}>
                        {r.attending ? 'Attending' : 'Declined'}
                      </span>
                    </td>
                    <td data-label="Side">
                      <Select
                        aria-label={`Side for ${r.name}`}
                        value={r.sideUserId ?? NO_SIDE}
                        onChange={(value) => changeSide(r, value)}
                        options={[
                          ...data.partners.map((p) => ({ value: p.userId, label: sideLabel(data.partners, p.userId) })),
                          { value: NO_SIDE, label: 'Not set' },
                        ]}
                      />
                      {r.sideSource === 'link' && <span className="hint">From their link</span>}
                    </td>
                    <td data-label="Replied">{repliedOn(r.createdAt)}</td>
                    <td data-label="Edit link">
                      {r.editLinkActive ? (
                        <button
                          type="button"
                          className="link-button"
                          onClick={(e) => askRevoke(r, e.currentTarget)}
                        >
                          Revoke edit link<span className="visually-hidden"> for {r.name}</span>
                        </button>
                      ) : (
                        <span className="hint">Link inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <dialog
        ref={dialogRef}
        className="dialog"
        aria-labelledby="revoke-title"
        onClose={() => {
          setRevoking(null)
          // Back to the button that opened it; if revoking removed that button, to the guest's name.
          const target = returnFocusRef.current
          if (target?.trigger.isConnected) target.trigger.focus()
          else if (target) document.getElementById(`guest-${target.rsvpId}`)?.focus()
        }}
      >
        <h2 id="revoke-title">Revoke {revoking?.name}’s edit link?</h2>
        <p className="muted">
          The private link they got when they replied will stop working, so they won’t be able to change their reply
          with it. Their reply stays as it is. This can’t be undone.
        </p>
        <div className="actions actions--end">
          <button type="button" className="btn btn--secondary" onClick={closeDialog} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn" onClick={confirmRevoke}>
            Revoke link
          </button>
        </div>
      </dialog>
    </div>
  )
}

/** Spreadsheet export of the replies, with sides spelled out. */
function downloadCsv(data: ResponsesData) {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
  const rows = [
    ['Name', 'Email', 'Phone', 'Reply', 'Side', 'Replied on'],
    ...data.rsvps.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.attending ? 'Attending' : 'Declined',
      sideLabel(data.partners, r.sideUserId),
      r.createdAt.slice(0, 10),
    ]),
  ]
  const csv = rows.map((row) => row.map(cell).join(',')).join('\r\n')
  // The byte-order mark makes Excel read the file as UTF-8, so accents like ọ and ẹ survive.
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `alarina-replies-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
