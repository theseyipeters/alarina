import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { api } from './api.ts'
import { errorMessage } from './errors.ts'

export type GiftsAccess = {
  unlocked: boolean
  price: number
  configured: boolean
  /** The wedding is over: guests can no longer give and Gifts can't be unlocked. */
  closed: boolean
  closedAfter: string | null
}

// Shared by the dashboard tabs, the overview and the Gifts page, so unlocking updates all of them.
let current: GiftsAccess | null = null
const listeners = new Set<() => void>()

export async function refreshGiftsAccess() {
  current = await api.get<GiftsAccess>('/wedding/gifts/access')
  listeners.forEach((notify) => notify())
}

const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => void listeners.delete(notify)
}

/**
 * Whether Gifts has been unlocked. `access` stays null until this visit has asked the server, so
 * a previous sign-in's answer is never shown; `failed` says why the server couldn't be asked.
 */
export function useGiftsAccess() {
  const shared = useSyncExternalStore(subscribe, () => current)
  const [asked, setAsked] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  const ask = useCallback(
    () =>
      refreshGiftsAccess().then(
        () => {
          setAsked(true)
          setFailed(null)
        },
        (err: unknown) => setFailed(errorMessage(err)),
      ),
    [],
  )

  useEffect(() => {
    void ask()
  }, [ask])

  return { access: asked ? shared : null, failed, retry: ask }
}
