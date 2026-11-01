import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.ts'
import type { Wedding, WeddingFields } from '../lib/types.ts'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
type Patch = Partial<WeddingFields> & { checkpoint?: number }

const DEBOUNCE_MS = 700

/**
 * Batches field changes into debounced PATCHes. Saves run one at a time, in order, so a slow
 * request can never overwrite a newer answer. Failed changes are kept and retried on the next save.
 */
export function useAutosave(onSaved: (wedding: Wedding) => void) {
  const pending = useRef<Patch>({})
  const timer = useRef<number | undefined>(undefined)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const onSavedRef = useRef(onSaved)
  const [status, setStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    onSavedRef.current = onSaved
  })

  const flush = useCallback((extra?: Patch) => {
    window.clearTimeout(timer.current)
    const body = { ...pending.current, ...extra }
    pending.current = {}
    if (Object.keys(body).length === 0) return queue.current

    setStatus('saving')
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          const { wedding } = await api.patch<{ wedding: Wedding }>('/wedding', body)
          onSavedRef.current(wedding)
          setStatus(Object.keys(pending.current).length ? 'pending' : 'saved')
        } catch (err) {
          pending.current = { ...body, ...pending.current }
          setStatus('error')
          throw err
        }
      })
    return queue.current
  }, [])

  const change = useCallback(
    (patch: Patch) => {
      Object.assign(pending.current, patch)
      setStatus('pending')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => flush().catch(() => {}), DEBOUNCE_MS)
    },
    [flush],
  )

  // Save straight away when the tab is hidden or the wizard unmounts, so nothing typed is lost.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush().catch(() => {})
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      flush().catch(() => {})
    }
  }, [flush])

  return { status, change, flush }
}
