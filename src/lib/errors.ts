import { ApiError } from './api.ts'

/** What to tell someone when a request fails: what happened, and what to do next. */
export function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.code === 'validation_error') return 'Check the details you entered.'
    if (err.code === 'rate_limited') return err.message || 'That’s a lot of tries. Wait a minute, then try again.'
    // In development the server sends the real error, which is worth seeing.
    if (err.status >= 500 && !import.meta.env.DEV) return 'Something went wrong on our side. Try again in a moment.'
    return err.message || 'Something went wrong. Try again.'
  }
  // The request never got an answer.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'You’re offline. Reconnect, then try again.'
  return 'Could not reach the server. Check your connection and try again.'
}

/** The thing asked for doesn't exist (or isn't this person's to see), rather than a failure to load it. */
export const isNotFound = (err: unknown) => err instanceof ApiError && err.status === 404

/** The request never got a proper answer: offline, the server is down, or it failed on our side. Worth trying again. */
export const isOutage = (err: unknown) => !(err instanceof ApiError) || err.status >= 500
