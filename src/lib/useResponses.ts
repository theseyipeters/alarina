import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api.ts'
import type { Responses } from './types.ts'

type State = { status: 'loading' } | { status: 'error' } | { status: 'none' } | { status: 'ready'; data: Responses }

/** The couple's replies. 'none' means there's no wedding yet, so there can't be any. */
export function useResponses() {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<Responses>('/wedding/rsvps').then(
        (data) => setState({ status: 'ready', data }),
        (err) => setState({ status: err instanceof ApiError && err.code === 'no_wedding' ? 'none' : 'error' }),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  return [state, setState, load] as const
}
