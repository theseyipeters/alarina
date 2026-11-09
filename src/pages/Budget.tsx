import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import BudgetPanel from '../planning/BudgetPanel.tsx'
import '../planning/planning.css'
import './Gifts.css'

/** The couple's cost breakdown. */
export default function Budget() {
  useTitle('Budget')
  const [wedding] = useWedding()

  if (wedding.status === 'loading') return <p className="muted">Loading…</p>
  if (wedding.status === 'error') return <p role="alert" className="alert">Your wedding couldn’t be loaded. Refresh to try again.</p>
  const weddingId = wedding.wedding?.id
  if (!weddingId) return <p className="muted">Start your wedding setup first, then track its costs here.</p>
  return <BudgetPanel weddingId={weddingId} />
}
