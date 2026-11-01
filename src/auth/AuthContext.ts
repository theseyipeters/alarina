import { createContext } from 'react'
import type { Session } from '../lib/types.ts'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | ({ status: 'signedIn' } & Session)

export type AuthContextValue = {
  state: AuthState
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  /** Replace the session snapshot, or re-fetch it when called without one. */
  refresh: (session?: Session) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
