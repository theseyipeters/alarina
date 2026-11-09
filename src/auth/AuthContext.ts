import { createContext } from 'react'
import type { CoupleSession, Session, VendorSession } from '../lib/types.ts'
import type { VendorCategory } from '../lib/vendors.ts'

/**
 * 'signedIn' is a couple, as it always was, so couples' pages keep working unchanged. Vendors
 * (planners included) are 'vendor', and have their own pages under /vendor.
 */
export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | ({ status: 'signedIn' } & Omit<CoupleSession, 'vendor'>)
  | ({ status: 'vendor' } & Omit<VendorSession, 'couple'>)

export type SignUpInput =
  | { kind?: 'couple'; name: string; email: string; password: string }
  | { kind: 'vendor'; name: string; email: string; password: string; businessName: string; category: VendorCategory }

export type AuthContextValue = {
  state: AuthState
  signUp: (input: SignUpInput) => Promise<void>
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  /** Replace the session snapshot, or re-fetch it when called without one. */
  refresh: (session?: Session) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Where an account lands after signing in. */
export const homeFor = (state: AuthState) => (state.status === 'vendor' ? '/vendor' : '/app')
