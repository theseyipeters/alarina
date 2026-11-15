import type { IncomingMessage, ServerResponse } from 'node:http'
import sharp from 'sharp'

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

const fontFor = (template?: string) => {
  if (template === 'poster') return 'Arial, sans-serif'
  if (template === 'garden') return 'Georgia, serif'
  if (template === 'modern') return 'Arial, sans-serif'
  return 'Georgia, serif'
}

function invitationArtwork(invitation: Invitation, page: string, card: string, ink: string, accent: string) {
  const one = esc(invitation.partnerOneName?.trim() || 'Your day')
  const two = esc(invitation.partnerTwoName?.trim() || '')
  const venueParts = invitation.venueAddress?.split(',') ?? []
  const venue = esc(invitation.venueName?.trim() || venueParts[venueParts.length - 1]?.trim() || '')
  const date = esc(dateLabel(invitation.date))
  const font = fontFor(invitation.template)
  const framed = ['classic', 'deco', 'minimal'].includes(invitation.template ?? '')
  const frame = framed
    ? `<rect x="128" y="88" width="944" height="454" rx="${invitation.template === 'deco' ? '0' : '3'}" fill="none" stroke="${accent}" stroke-width="2"/><rect x="140" y="100" width="920" height="430" fill="none" stroke="${accent}" stroke-width="1" opacity=".45"/>`
    : ''
  const poster = invitation.template === 'poster'
    ? `<rect x="110" y="70" width="980" height="490" fill="${card}"/><rect x="110" y="70" width="980" height="16" fill="${accent}"/>`
    : ''
  const namesSize = Math.max(34, Math.min(68, 920 / Math.max(one.length, two.length, 12) * 1.1))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${page}"/>
    <rect x="110" y="70" width="980" height="490" rx="${invitation.template === 'deco' ? '0' : '8'}" fill="${card}" stroke="${accent}" stroke-width="${framed ? '0' : '1.5'}"/>
    ${poster}${frame}
    <text x="600" y="178" text-anchor="middle" fill="${accent}" font-family="Arial, sans-serif" font-size="17" letter-spacing="6">TOGETHER WITH THEIR FAMILIES</text>
    <text x="600" y="282" text-anchor="middle" fill="${ink}" font-family="${font}" font-size="${namesSize}" textLength="${Math.min(850, Math.max(240, one.length * namesSize * .54))}" lengthAdjust="spacingAndGlyphs">${one}</text>
    <text x="600" y="335" text-anchor="middle" fill="${accent}" font-family="${font}" font-size="38">&amp;</text>
    <text x="600" y="395" text-anchor="middle" fill="${ink}" font-family="${font}" font-size="${namesSize}" textLength="${Math.min(850, Math.max(240, two.length * namesSize * .54))}" lengthAdjust="spacingAndGlyphs">${two}</text>
    <line x1="530" y1="426" x2="670" y2="426" stroke="${accent}" stroke-width="1.5"/>
    <text x="600" y="464" text-anchor="middle" fill="${accent}" font-family="Arial, sans-serif" font-size="20" letter-spacing="4">${date}</text>
    ${venue ? `<text x="600" y="500" text-anchor="middle" fill="${ink}" font-family="${font}" font-size="20">${venue}</text>` : ''}
  </svg>`
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const forwardedHost = request.headers['x-forwarded-host']
  const hostHeader = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost
  const host = hostHeader || request.headers.host || 'alarina.ng'
  const forwardedProto = request.headers['x-forwarded-proto']
  const protocolHeader = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto
  const origin = `${protocolHeader || 'https'}://${host}`
  const url = new URL(request.url || '/', origin)
  const slug = url.searchParams.get('slug')
  if (!slug || !/^[a-z0-9-]{1,80}$/i.test(slug)) {
    response.statusCode = 404
    response.end('Invitation not found')
    return
  }

  const apiOrigin = process.env.VITE_API_URL || process.env.API_URL
  if (!apiOrigin) {
    response.statusCode = 503
    response.end('Invitation preview is not configured')
    return
  }

  let invitationResponse: globalThis.Response
  try {
    invitationResponse = await fetch(`${apiOrigin.replace(/\/$/, '')}/api/public/invitations/${encodeURIComponent(slug)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    response.statusCode = 503
    response.setHeader('cache-control', 'no-store')
    response.end('Invitation preview is temporarily unavailable')
    return
  }
  if (!invitationResponse.ok) {
    response.statusCode = invitationResponse.status === 404 ? 404 : 503
    response.end(invitationResponse.status === 404 ? 'Invitation not found' : 'Invitation preview is temporarily unavailable')
    return
  }
  const payload = await invitationResponse.json() as { invitation?: Invitation }
  const invitation = payload.invitation
  if (!invitation) {
    response.statusCode = 404
    response.end('Invitation not found')
    return
  }

  const one = invitation.partnerOneName?.trim() || 'Your day'
  const two = invitation.partnerTwoName?.trim() || ''
  const names = [one, two].filter(Boolean).join(' & ')
  const title = `${names} · Wedding invitation`
  const addressParts = invitation.venueAddress?.split(',') ?? []
  const venue = invitation.venueName?.trim() || addressParts[addressParts.length - 1]?.trim() || ''
  const description = [dateLabel(invitation.date), venue].filter(Boolean).join(' · ')
  const imageUrl = `${origin}/api/invite-preview?slug=${encodeURIComponent(slug)}&image=1`
  const fallbackColors = palettes[invitation.palette ?? 'ivory'] ?? palettes.ivory
  const page = invitation.look?.colors?.page ?? fallbackColors[0]
  const card = invitation.look?.colors?.card ?? fallbackColors[1]
  const ink = invitation.look?.colors?.text ?? fallbackColors[2]
  const accent = invitation.look?.colors?.accent ?? fallbackColors[3]

  if (url.searchParams.has('image')) {
    let png: Buffer
    try {
      png = await sharp(Buffer.from(invitationArtwork(invitation, page, card, ink, accent))).png().toBuffer()
    } catch {
      response.statusCode = 503
      response.setHeader('cache-control', 'no-store')
      response.end('Invitation preview is temporarily unavailable')
      return
    }
    response.statusCode = 200
    response.setHeader('content-type', 'image/png')
    response.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400')
    response.end(png)
    return
  }

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Alárinà"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(`${origin}/invite/${slug}`)}"><meta property="og:image" content="${esc(imageUrl)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageUrl)}"></head><body><p>${esc(names)}’s wedding invitation</p></body></html>`
  response.statusCode = 200
  response.setHeader('content-type', 'text/html; charset=utf-8')
  response.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400')
  response.setHeader('vary', 'user-agent')
  response.end(html)
}
