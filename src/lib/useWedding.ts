import { useEffect, useState } from 'react'
import { api } from './api.ts'
import type { Wedding } from './types.ts'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; wedding: Wedding | null }

export function useWedding() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get<{ wedding: Wedding | null }>('/wedding').then(
      ({ wedding }) => !cancelled && setState({ status: 'ready', wedding }),
      () => !cancelled && setState({ status: 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [])

  const setWedding = (wedding: Wedding) => setState({ status: 'ready', wedding })
  return [state, setWedding] as const
}
