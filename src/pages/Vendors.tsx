import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatNaira } from '../lib/money.ts'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import NotesPanel from '../planning/NotesPanel.tsx'
import PlannersPanel from '../planning/PlannersPanel.tsx'
import TeamPanel from '../planning/TeamPanel.tsx'
import '../planning/planning.css'
import './Gifts.css'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'

/** The couple's vendors: their team, bookings and payments, and the planners working with them. */
export default function Vendors() {
  useTitle('Vendors')
  const [wedding, , retry] = useWedding()
  const [params, setParams] = useSearchParams()
  const reference = params.get('payment')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const weddingId = wedding.status === 'ready' ? wedding.wedding?.id : undefined

  // Back from paying a vendor on Paystack: confirm it with the server, then say what happened.
  useEffect(() => {
    if (!reference || !weddingId) return
    let cancelled = false
    api.post<{ status: string; amount: number }>(`/planning/${weddingId}/payments/verify`, { reference }).then(
      ({ status, amount }) => {
        if (cancelled) return
        setMessage(
          status === 'success'
            ? { ok: true, text: `Payment of ${formatNaira(amount)} received. It’s on your budget.` }
            : status === 'pending'
              ? { ok: false, text: 'Paystack hasn’t confirmed your payment yet. This usually takes a few seconds; refresh shortly.' }
              : { ok: false, text: 'Your payment didn’t go through. You haven’t been charged.' },
        )
        setParams({}, { replace: true })
      },
      (err) => {
        if (cancelled) return
        setMessage({ ok: false, text: errorMessage(err) })
        setParams({}, { replace: true })
      },
    )
    return () => {
      cancelled = true
    }
  }, [reference, weddingId, setParams])

  if (wedding.status === 'loading') return <Loading />
  if (wedding.status === 'error') return <LoadError title="Your wedding didn’t load" message={wedding.message} onRetry={retry} />
  if (!weddingId) {
    return (
      <EmptyState card icon="store" title="Set up your wedding first" action={<Link to="/app/setup" className="btn">Set up your wedding</Link>}>
        Once your names and date are in, this is where you keep your vendors, bookings and payments.
      </EmptyState>
    )
  }

  return (
    <div className="gifts">
      {message && <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'alert alert--success' : 'alert'}>{message.text}</p>}
      <div className="gifts-grid">
        <TeamPanel weddingId={weddingId} role="couple" />
        <div className="stack">
          <PlannersPanel weddingId={weddingId} role="couple" />
          <NotesPanel weddingId={weddingId} role="couple" />
        </div>
      </div>
    </div>
  )
}
