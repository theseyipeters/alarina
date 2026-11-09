import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api.ts'
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
      () => !cancelled && setState({ status: 'signedOut' }),
    )
    return () => {
      cancelled = true
    }
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
