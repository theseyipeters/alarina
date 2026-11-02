/** "2027-12-12" → "Sunday, 12 December 2027". Built from parts so the day never shifts with time zones. */
export function formatDate(value: string | null) {
  if (!value) return ''
  const [y, m, d] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y!, m! - 1, d!),
  )
}

/** "14:00" → "2:00 pm" */
export function formatTime(value: string | null) {
  if (!value) return ''
  const [h, min] = value.split(':').map(Number)
  return new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true })
    .format(new Date(2000, 0, 1, h!, min!))
    .toLowerCase()
}

export const todayInLagos = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date())

export const coupleNames = (a: string | null, b: string | null) => [a, b].filter(Boolean).join(' & ')

/** Whole days from today (in Lagos) to a YYYY-MM-DD date; negative once it has passed. */
export function daysUntil(date: string) {
  const toUtc = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return Date.UTC(y!, m! - 1, day!)
  }
  return Math.round((toUtc(date) - toUtc(todayInLagos())) / 86_400_000)
}
