import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.ts'
import { errorMessage, isNotFound } from '../lib/errors.ts'

export type Loaded<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'ready'; data: T }

const failed = (err: unknown) => ({ status: 'error' as const, message: errorMessage(err), notFound: isNotFound(err) })

/**
 * Loads a GET endpoint, and gives back a reload: for after changes, and for "Try again" when the
 * first load failed. A reload that fails keeps what is already on screen rather than replacing
 * the page with an error.
 */
export function useLoad<T>(path: string | null) {
  const [state, setState] = useState<Loaded<T>>({ status: 'loading' })

  const reload = useCallback(async () => {
    if (!path) return
    try {
      const data = await api.get<T>(path)
      setState({ status: 'ready', data })
    } catch (err) {
      setState((current) => (current.status === 'ready' ? current : failed(err)))
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
      (err: unknown) => !cancelled && setState(failed(err)),
    )
    return () => {
      cancelled = true
    }
  }, [path])

  return [state, reload] as const
}
