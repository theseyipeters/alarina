import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth.ts'
import { api } from './api.ts'
import type { VendorListing } from './types.ts'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; vendor: VendorListing }

/** The signed-in vendor's listing. Saving one refreshes the session too, so the header's status stays right. */
export function useVendor() {
  const { refresh } = useAuth()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get<{ vendor: VendorListing }>('/vendor').then(
      ({ vendor }) => !cancelled && setState({ status: 'ready', vendor }),
      () => !cancelled && setState({ status: 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [])

  const setVendor = useCallback(
    (vendor: VendorListing) => {
      setState({ status: 'ready', vendor })
      refresh().catch(() => {})
    },
    [refresh],
  )

  return [state, setVendor] as const
}
