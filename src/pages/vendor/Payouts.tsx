import PayoutAccount from '../../components/PayoutAccount.tsx'
import { api } from '../../lib/api.ts'
import type { VendorListing } from '../../lib/types.ts'
import { useTitle } from '../../lib/useTitle.ts'
import { useVendor } from '../../lib/useVendor.ts'
import '../Gifts.css'

/** Where couples' and guests' payments to the vendor are paid. */
export default function Payouts() {
  useTitle('Payouts')
  const [state, setVendor] = useVendor()

  if (state.status === 'loading') return <p className="muted">Loading…</p>
  if (state.status === 'error') return <p role="alert" className="alert">Your payout account couldn’t be loaded. Refresh to try again.</p>

  return (
    <div className="gifts">
      <PayoutAccount
        payout={state.vendor.payout}
        // Reload the listing, which refreshes the session too, so the header's "Add account" flag clears.
        onSaved={() => api.get<{ vendor: VendorListing }>('/vendor').then(({ vendor }) => setVendor(vendor), () => {})}
        paths={{ banks: '/vendor/payout/banks', resolve: '/vendor/payout/resolve', save: '/vendor/payout' }}
        title="Where you’re paid"
        intro="Couples’ bookings and guests’ gift orders are paid into this Nigerian bank account by Paystack. We check the name on it before saving."
        passwordHint="This decides where your money goes, so we check it’s you."
      />
      <p className="muted">
        Couples pay Paystack’s fee on top, so you receive the full amount of every payment. Alárinà takes no commission.
      </p>
    </div>
  )
}
