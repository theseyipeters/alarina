import { Link } from 'react-router'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import BudgetPanel from '../planning/BudgetPanel.tsx'
import '../planning/planning.css'
import './Gifts.css'
import { EmptyState, LoadError, Loading } from '../components/States.tsx'

/** The couple's cost breakdown. */
export default function Budget() {
  useTitle('Budget')
  const [wedding, , retry] = useWedding()

  if (wedding.status === 'loading') return <Loading />
  if (wedding.status === 'error') return <LoadError title="Your wedding didn’t load" message={wedding.message} onRetry={retry} />
  const weddingId = wedding.wedding?.id
  if (!weddingId) {
    return (
      <EmptyState card icon="wallet" title="Set up your wedding first" action={<Link to="/app/setup" className="btn">Set up your wedding</Link>}>
        Once your names and date are in, this is where you track what the day costs and what’s been paid.
      </EmptyState>
    )
  }
  return <BudgetPanel weddingId={weddingId} />
}
