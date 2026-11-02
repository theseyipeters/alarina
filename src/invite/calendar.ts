import type { PublicInvitation } from '../lib/types.ts'

// Weddings rarely list an end time, so calendar entries assume five hours.
const DURATION_MS = 5 * 60 * 60 * 1000

/** Start and end as UTC instants. Nigeria is UTC+1 all year (no daylight saving). */
function range(w: PublicInvitation) {
  const start = new Date(`${w.date}T${w.startTime ?? '12:00'}:00+01:00`)
  return { start, end: new Date(start.getTime() + DURATION_MS) }
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const title = (w: PublicInvitation) => `${w.partnerOneName} & ${w.partnerTwoName}’s wedding`
const place = (w: PublicInvitation) => [w.venueName, w.venueAddress].filter(Boolean).join(', ')
const inviteUrl = (w: PublicInvitation) => `${window.location.origin}/invite/${w.slug}`

export function googleCalendarUrl(w: PublicInvitation) {
  const { start, end } = range(w)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title(w),
    dates: `${stamp(start)}/${stamp(end)}`,
    location: place(w),
    details: `Invitation and RSVP: ${inviteUrl(w)}`,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Builds an .ics file (Apple Calendar, Outlook and most others) and starts the download. */
export function downloadIcs(w: PublicInvitation) {
  const { start, end } = range(w)
  const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alarina//Wedding invitation//EN',
    'BEGIN:VEVENT',
    `UID:${w.slug}@alarina`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title(w))}`,
    `LOCATION:${esc(place(w))}`,
    `DESCRIPTION:${esc(`Invitation and RSVP: ${inviteUrl(w)}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${w.slug}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
