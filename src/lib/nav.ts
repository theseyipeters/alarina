/** Only same-site paths are valid post-login destinations (blocks open redirects like //evil.com). */
export function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}

export const withNext = (path: string, next: string | null) =>
  next ? `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}` : path
