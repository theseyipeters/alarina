export type User = { id: string; name: string; email: string }

export type Couple = {
  id: string
  partner: { name: string; email: string } | null
  pendingInvite: { email: string | null; expiresAt: string } | null
}

export type Session = { user: User; couple: Couple }
