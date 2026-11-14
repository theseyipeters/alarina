import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

type Invitation = {
  partnerOneName?: string | null
  partnerTwoName?: string | null
  date?: string | null
  venueName?: string | null
  venueAddress?: string | null
  palette?: string
  template?: string
  look?: { colors?: { page?: string; card?: string; text?: string; accent?: string } }
}

const palettes: Record<string, [string, string, string, string]> = {
  ivory: ['#f4f0e6', '#fffdf7', '#292720', '#9a7240'], sage: ['#e8eee5', '#fbfcf8', '#283329', '#617b5a'],
  blush: ['#f4e7e5', '#fffaf8', '#392d2d', '#ae6f75'], terracotta: ['#efe2d9', '#fffaf5', '#382d27', '#a3543a'],
  champagne: ['#f1eadc', '#fffdf7', '#352e25', '#a18453'], lavender: ['#ece8f3', '#fcfaff', '#302b39', '#78658f'],
  ocean: ['#e3edf0', '#f9fcfd', '#26343a', '#487c89'], noir: ['#1d1e1c', '#252724', '#f2eee4', '#c9aa72'],
  emerald: ['#e9eee5', '#fbfcf7', '#263329', '#987343'], midnight: ['#e3e8f1', '#fafbff', '#272c3b', '#667ba4'],
  indigo: ['#e6eaf1', '#fafbfe', '#252d3c', '#526c9e'], wine: ['#f0e4e6', '#fffafb', '#38282c', '#98606b'],
}

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const dateLabel = (date?: string | null) => {
  if (!date) return 'SAVE THE DATE'
  const parsed = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return 'SAVE THE DATE'
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parsed).toUpperCase()
}

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  if (!slug || !/^[a-z0-9-]{1,80}$/i.test(slug)) return new Response('Invitation not found', { status: 404 })

  const apiOrigin = process.env.VITE_API_URL || process.env.API_URL
  if (!apiOrigin) return new Response('Invitation preview is not configured', { status: 503 })

  const response = await fetch(`${apiOrigin.replace(/\/$/, '')}/api/public/invitations/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) return new Response('Invitation not found', { status: 404 })
  const payload = await response.json() as { invitation?: Invitation }
  const invitation = payload.invitation
  if (!invitation) return new Response('Invitation not found', { status: 404 })

  const one = invitation.partnerOneName?.trim() || 'Your day'
  const two = invitation.partnerTwoName?.trim() || ''
  const names = [one, two].filter(Boolean).join(' & ')
  const title = `${names} · Wedding invitation`
  const venue = invitation.venueName?.trim() || invitation.venueAddress?.split(',').at(-1)?.trim() || ''
  const description = [dateLabel(invitation.date), venue].filter(Boolean).join(' · ')
  const imageUrl = `${url.origin}/api/invite-preview?slug=${encodeURIComponent(slug)}&image=1`
  const [page, card, ink, accent] = invitation.look?.colors
    ? [invitation.look.colors.page, invitation.look.colors.card, invitation.look.colors.text, invitation.look.colors.accent]
    : palettes[invitation.palette ?? 'ivory'] ?? palettes.ivory

  if (url.searchParams.has('image')) {
    const deco = invitation.template === 'deco' || invitation.template === 'classic'
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: page, color: ink, fontFamily: 'serif' }}>
        <div style={{ width: 980, height: 490, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: card, border: `2px solid ${accent}`, outline: deco ? `1px solid ${accent}` : 'none', outlineOffset: -18, padding: '48px 64px', textAlign: 'center' }}>
          <div style={{ display: 'flex', color: accent, fontSize: 18, letterSpacing: 8, marginBottom: 24 }}>TOGETHER WITH THEIR FAMILIES</div>
          <div style={{ display: 'flex', fontSize: 62, lineHeight: 1.12, maxWidth: 850, justifyContent: 'center', textAlign: 'center' }}>{names}</div>
          <div style={{ display: 'flex', color: accent, fontSize: 22, letterSpacing: 7, marginTop: 25 }}>{dateLabel(invitation.date)}</div>
          {venue && <div style={{ display: 'flex', fontSize: 20, marginTop: 13 }}>{venue}</div>}
          <div style={{ display: 'flex', width: 100, height: 1, background: accent, marginTop: 24 }} />
        </div>
      </div>,
      { width: 1200, height: 630 },
    )
  }

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Alárinà"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(`${url.origin}/invite/${slug}`)}"><meta property="og:image" content="${esc(imageUrl)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageUrl)}"></head><body><p>${esc(names)}’s wedding invitation</p></body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' } })
}
