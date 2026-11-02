export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

// The API runs as its own server (VITE_API_URL, e.g. http://localhost:5001 in development).
const API_BASE = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`

async function request<T>(path: string, { body, headers, ...init }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    // The API is on another origin, so the session cookie has to be sent explicitly.
    credentials: 'include',
    ...init,
    headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

  const data: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error
    throw new ApiError(res.status, error?.code ?? 'error', error?.message ?? res.statusText, error?.details)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
