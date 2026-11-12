import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, SESSION_ENDED } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import type { Session } from '../lib/types.ts'
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext.ts'

type Me = Session | { user: null; couple: null; vendor: null }

const toState = (me: Me): AuthState => {
  if (!me.user) return { status: 'signedOut' }
  if (me.vendor) return { status: 'vendor', user: me.user, vendor: me.vendor }
  return me.couple ? { status: 'signedIn', user: me.user, couple: me.couple } : { status: 'signedOut' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get<Me>('/auth/me').then(
      (me) => !cancelled && setState(toState(me)),
      // A server that can't be reached isn't a signed-out visitor: don't send them to sign in.
      (err: unknown) =>
        !cancelled && setState(err instanceof ApiError && err.status < 500 ? { status: 'signedOut' } : { status: 'unreachable', message: errorMessage(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [])

  // The session ended while they were using the app: sign-in is the way back to where they were.
  useEffect(() => {
    const ended = () =>
      setState((current) => (current.status === 'signedIn' || current.status === 'vendor' ? { status: 'signedOut', expired: true } : current))
    window.addEventListener(SESSION_ENDED, ended)
    return () => window.removeEventListener(SESSION_ENDED, ended)
  }, [])

  const refresh = useCallback(async (session?: Session) => {
    setState(toState(session ?? (await api.get<Me>('/auth/me'))))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      refresh,
      signUp: async (input) => refresh(await api.post<Session>('/auth/signup', input)),
      signIn: async (input) => refresh(await api.post<Session>('/auth/signin', input)),
      signOut: async () => {
        await api.post('/auth/signout')
        setState({ status: 'signedOut' })
      },
    }),
    [state, refresh],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
