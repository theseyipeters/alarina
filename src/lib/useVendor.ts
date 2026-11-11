import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth.ts'
import { api } from './api.ts'
import { errorMessage } from './errors.ts'
import type { VendorListing } from './types.ts'

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; vendor: VendorListing }

/**
 * The signed-in vendor's listing, with a retry for a failed load. Saving one refreshes the
 * session too, so the header's status stays right.
 */
export function useVendor() {
  const { refresh } = useAuth()
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<{ vendor: VendorListing }>('/vendor').then(
        ({ vendor }) => setState({ status: 'ready', vendor }),
        (err: unknown) => setState({ status: 'error', message: errorMessage(err) }),
      ),
    [],
  )

  useEffect(() => {
    void load()
  }, [load])

  const setVendor = useCallback(
    (vendor: VendorListing) => {
      setState({ status: 'ready', vendor })
      refresh().catch(() => {})
    },
    [refresh],
  )

  return [state, setVendor, load] as const
}
