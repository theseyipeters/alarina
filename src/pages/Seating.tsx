import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import SeatingEditor from '../seating/SeatingEditor.tsx'
import './Gifts.css'

/** The couple's seating plan. */
export default function Seating() {
  useTitle('Seating')
  const [wedding] = useWedding()

  if (wedding.status === 'loading') return <p className="muted">Loading…</p>
  if (wedding.status === 'error') return <p role="alert" className="alert">Your wedding couldn’t be loaded. Refresh to try again.</p>
  const weddingId = wedding.wedding?.id
  if (!weddingId) return <p className="muted">Start your wedding setup first, then plan your tables here.</p>
  return <SeatingEditor weddingId={weddingId} />
}
