// Calendar arithmetic on YYYY-MM-DD strings. Dates are built in UTC and read back in UTC, so a
// day never shifts with the viewer's time zone.

const toDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!))
}

const toYmd = (date: Date) => date.toISOString().slice(0, 10)

export const addDays = (ymd: string, days: number) => {
  const d = toDate(ymd)
  d.setUTCDate(d.getUTCDate() + days)
  return toYmd(d)
}

/** Moves by whole months, keeping the day of the month where it exists (31 Jan + 1 month = 28 Feb). */
export const addMonths = (ymd: string, months: number) => {
  const d = toDate(ymd)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return toYmd(d)
}

/** The weeks of a month as rows of seven, Monday first. Days outside the month are null. */
export function monthWeeks(ymd: string) {
  const first = toDate(ymd)
  first.setUTCDate(1)
  const year = first.getUTCFullYear()
  const month = first.getUTCMonth()
  const lead = (first.getUTCDay() + 6) % 7
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length }, (_, i) => toYmd(new Date(Date.UTC(year, month, i + 1)))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
}

export const monthTitle = (ymd: string) =>
  new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(toDate(ymd))

export const dayNumber = (ymd: string) => toDate(ymd).getUTCDate()

/** "Sat, 12 Jun 2027": short enough for a field. */
export const shortDate = (ymd: string) =>
  new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    toDate(ymd),
  )

/** "Saturday, 12 June 2027": read out for screen readers. */
export const longDate = (ymd: string) =>
  new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    toDate(ymd),
  )

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
