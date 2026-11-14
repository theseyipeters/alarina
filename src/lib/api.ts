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

/** Fired on window when the server says a signed-in request has no session. */
export const SESSION_ENDED = 'alarina:session-ended'

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; blob?: boolean }

// The API runs as its own server (VITE_API_URL, e.g. http://localhost:5001 in development).
const API_BASE = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`

async function request<T>(path: string, { body, headers, blob, ...init }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    // The API is on another origin, so the session cookie has to be sent explicitly.
    credentials: 'include',
    ...init,
    // A Blob (a photo) goes up as it is; anything else is JSON.
    headers: {
      ...(body !== undefined && { 'Content-Type': body instanceof Blob ? body.type : 'application/json' }),
      ...headers,
    },
    ...(body !== undefined && { body: body instanceof Blob ? body : JSON.stringify(body) }),
  })

  // A photo comes back as itself; everything else is JSON.
  if (res.ok && blob) return (await res.blob()) as T
  const data: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error
    // Signed out somewhere else, or the session ran out: the auth provider sends them to sign in.
    if (res.status === 401 && error?.code === 'unauthenticated') window.dispatchEvent(new Event(SESSION_ENDED))
    // A proxy's error page has no JSON, and HTTP/2 has no status text, so there may be nothing to quote.
    throw new ApiError(res.status, error?.code ?? 'error', error?.message || res.statusText, error?.details)
  }

  return data as T
}

/** The full address of an API path, for links the browser opens itself (such as file downloads). */
export const apiUrl = (path: string) => `${API_BASE}${path}`

/** Where an uploaded item photo is served from. */
export const imageSrc = (imageId: string) => `${API_BASE}/public/images/${imageId}`

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** POSTs JSON and returns the response body as a Blob, such as a photo. */
  postForBlob: (path: string, body?: unknown) => request<Blob>(path, { method: 'POST', body, blob: true }),
}
