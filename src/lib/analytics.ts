// Analytics runs only after a visitor clicks Allow. Umami sets no cookies and records no personal data.
// Guest pages (/invite, /rsvp) are never measured: their addresses identify a private event or a guest.

const SCRIPT_SRC = 'https://cloud.umami.is/script.js'
const WEBSITE_ID = '6b6d5c89-b741-4eb7-9a65-f37b0e5781bf'
const STORAGE_KEY = 'alarina-analytics'

export type Consent = 'allowed' | 'declined'

const PRIVATE_PATHS = ['/invite/', '/rsvp/']

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATHS.some((prefix) => path.startsWith(prefix))
}

export function getConsent(): Consent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'allowed' || value === 'declined' ? value : null
  } catch {
    return null
  }
}

export function setConsent(value: Consent): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage is blocked: the choice applies to this visit only.
  }
  if (value === 'allowed') loadAnalytics()
}

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, string>) => void }
    alarinaBeforeSend?: (type: string, payload: { url?: string }) => unknown
  }
}

export function loadAnalytics(): void {
  if (document.querySelector('script[data-alarina-analytics]')) return
  window.alarinaBeforeSend = (_type, payload) => {
    const path = (payload.url ?? '').replace(/^https?:\/\/[^/]+/, '')
    return isPrivatePath(path) ? null : payload
  }
  const script = document.createElement('script')
  script.defer = true
  script.src = SCRIPT_SRC
  script.dataset.websiteId = WEBSITE_ID
  script.dataset.beforeSend = 'alarinaBeforeSend'
  script.dataset.alarinaAnalytics = ''
  document.head.appendChild(script)
}

/**
 * Records a product event (never anything personal: a fixed name and at most a fixed label).
 * Does nothing unless the visitor allowed analytics and the script has loaded.
 */
export function track(name: string, data?: Record<string, string>): void {
  if (getConsent() !== 'allowed') return
  window.umami?.track(name, data)
}
