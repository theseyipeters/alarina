import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { readDemoNames } from '../lib/demoNames.ts'
import { formatDate } from '../lib/format.ts'
import { SAMPLE } from '../lib/heroDemo.ts'
import { Petals } from './Celebration.tsx'
import HeroInvitation from './HeroInvitation.tsx'
import HeroVendor from './HeroVendor.tsx'
import Logo from './Logo.tsx'
import './AuthLayout.css'

export type Audience = 'couple' | 'vendor'

const ART: Record<Audience, { title: string; note: string; chips: { text: string; icon: string }[] }> = {
  couple: {
    title: 'Every invitation, every reply, in one place.',
    note: 'Made for Nigerian weddings, planned by two.',
    chips: [
      { text: 'Your partner joined', icon: '♡' },
      { text: '₦25,000 gift received', icon: '₦' },
      { text: '84 accepted · 31 waiting', icon: '◎' },
    ],
  },
  vendor: {
    title: 'Be there when couples choose who makes their day.',
    note: 'Made for Nigerian weddings, and the people who make them.',
    // The listing scene already shows its enquiry, quote and deposit arriving.
    chips: [],
  },
}

const brand = (className: string) => (
  <Link to="/" className={`brand ${className}`} aria-label="Alárinà home">
    <Logo />
  </Link>
)

/**
 * Sign-in, sign-up and invite pages: the form on one side and an emerald panel on the other,
 * like the landing page's finale. Petals drift and glows move behind a headline that rises in
 * word by word, the scene for whoever the page is for (couples: the envelope, vendors: a
 * listing) and chips that pop in around it. If the visitor typed names in the landing demo,
 * sign-up greets them and the couple's envelope carries them. On phones the panel becomes a short band with the logo
 * and headline above the form. Reduced motion shows it all still.
 */
export default function AuthLayout({
  children,
  audience = 'couple',
  personal = false,
}: {
  children: ReactNode
  audience?: Audience
  /** Sign-up only: greet the couple by the names they typed on the landing page, if any. */
  personal?: boolean
}) {
  const { title, note, chips } = ART[audience]
  // Read once: the names only change on the landing page.
  const [stored] = useState(readDemoNames)
  const names = personal ? stored : null
  const heading = audience === 'couple' && names?.one && names?.two ? `${names.one} & ${names.two}, let’s make it yours.` : title

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="auth-glow" aria-hidden="true"><span /><span /><span /></div>
        <Petals />
        {brand('auth-brand')}
        {/* Keyed, so the panel plays again when sign-up switches between couples and vendors. */}
        <div key={audience} className="auth-art-scene" aria-hidden="true">
          <p className="auth-art-title">
            {heading.split(' ').map((word, i) => (
              <span key={i}>
                <span className="auth-word">{word}</span>{' '}
              </span>
            ))}
          </p>
          <div className="auth-art-figure">
            {audience === 'vendor' ? (
              <HeroVendor />
            ) : (
              <HeroInvitation
                one={names?.one || undefined}
                two={names?.two || undefined}
                date={names?.one ? formatDate(names.date || SAMPLE.date) : undefined}
                venue={names?.one ? 'The Garden Hall, Lagos' : undefined}
              />
            )}
            {chips.length > 0 && (
            <ul className="auth-chips">
              {chips.map((chip) => (
                <li key={chip.text} className="auth-chip">
                  <span className="auth-chip-icon">{chip.icon}</span>
                  {chip.text}
                </li>
              ))}
            </ul>
            )}
          </div>
        </div>
        <p key={`${audience}-note`} className="auth-art-note" aria-hidden="true">{note}</p>
      </div>
      <main id="main" className="auth-main">
        <div className="auth-column">{children}</div>
      </main>
    </div>
  )
}
