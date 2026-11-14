import { EmptyState } from '../components/States.tsx'
import { useTitle } from '../lib/useTitle.ts'
import './Gifts.css'

/** Couple-facing budget tracking is not available yet. */
export default function Budget() {
  useTitle('Budget')

  return (
    <EmptyState card icon="wallet" title="Budget tracking is coming soon">
      You’ll be able to plan wedding costs and keep track of payments here. Check back soon.
    </EmptyState>
  )
}
