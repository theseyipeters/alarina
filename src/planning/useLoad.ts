import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.ts'

export type Loaded<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T }

/** Loads a GET endpoint, and gives back a reload for after changes. */
export function useLoad<T>(path: string | null) {
  const [state, setState] = useState<Loaded<T>>({ status: 'loading' })

  const reload = useCallback(async () => {
    if (!path) return
    try {
      setState({ status: 'ready', data: await api.get<T>(path) })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Couldn’t load this' })
    }
  }, [path])

  // A new path shows its own loading state, not the last path's data.
  const [loadedPath, setLoadedPath] = useState(path)
  if (loadedPath !== path) {
    setLoadedPath(path)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    let cancelled = false
    if (!path) return
    api.get<T>(path).then(
      (data) => !cancelled && setState({ status: 'ready', data }),
      (err: unknown) => !cancelled && setState({ status: 'error', message: err instanceof Error ? err.message : 'Couldn’t load this' }),
    )
    return () => {
      cancelled = true
    }
  }, [path])

  return [state, reload] as const
}
