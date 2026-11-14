import { EmptyState } from '../components/States.tsx'
import { useTitle } from '../lib/useTitle.ts'
import './Gifts.css'

/** Couple-facing vendor planning is not available yet. */
export default function Vendors() {
  useTitle('Vendors')

  return (
    <EmptyState card icon="store" title="Vendor planning is coming soon">
      You’ll be able to keep your wedding vendors, bookings and payments together here. Check back soon.
    </EmptyState>
  )
}
