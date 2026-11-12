import { useCallback, useEffect, useState } from 'react'
import { api } from './api.ts'
import { errorMessage } from './errors.ts'
import type { Wedding } from './types.ts'

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; wedding: Wedding | null }

/** The couple's wedding (null before setup), a setter for after saving, and a retry for a failed load. */
export function useWedding() {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    () =>
      api.get<{ wedding: Wedding | null }>('/wedding').then(
        ({ wedding }) => setState({ status: 'ready', wedding }),
        (err: unknown) => setState({ status: 'error', message: errorMessage(err) }),
      ),
    [],
  )

  useEffect(() => {
    void load()
  }, [load])

  const setWedding = (wedding: Wedding) => setState({ status: 'ready', wedding })
  return [state, setWedding, load] as const
}
