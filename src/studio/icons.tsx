import type { ReactNode } from 'react'

// Line icons for the Studio's chrome. 24px grid, drawn in currentColor, always decorative:
// every control that uses one also has a text label.

type Props = { className?: string }

function Icon({ className, children }: Props & { children: ReactNode }) {
  return (
    <svg className={className ? `studio-icon ${className}` : 'studio-icon'} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

export const LayoutsIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </Icon>
)

export const ColoursIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 2-2 0-1.4-1.2-1.6-1.2-2.8 0-1 .8-1.7 1.8-1.7h2.2a3.7 3.7 0 0 0 3.7-3.8C20.5 6.6 16.7 3.5 12 3.5z" />
    <circle cx="7.8" cy="11" r="1.2" />
    <circle cx="10.5" cy="7.2" r="1.2" />
    <circle cx="15" cy="7.6" r="1.2" />
  </Icon>
)

export const TypeIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M4 19 9.5 5h1L16 19M6.2 14h7.6" />
    <path d="M17.5 12.5c.6-.6 1.4-1 2.3-1 1.3 0 2.2.8 2.2 2.2V19m0-3.2c-.8-.4-1.6-.5-2.5-.5-1.3 0-2.3.7-2.3 1.9s.9 1.9 2 1.9c1.2 0 2.2-.7 2.8-1.6" />
  </Icon>
)

export const FinishIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5-2-6.5-6.5-2 6.5-2z" />
    <path d="M19 3.5v3M17.5 5h3" />
  </Icon>
)

export const UndoIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M9 7 4.5 11.5 9 16" />
    <path d="M4.5 11.5h10a5 5 0 0 1 0 10H12" />
  </Icon>
)

export const RedoIcon = (p: Props) => (
  <Icon {...p}>
    <path d="m15 7 4.5 4.5L15 16" />
    <path d="M19.5 11.5h-10a5 5 0 0 0 0 10H12" />
  </Icon>
)

export const ShuffleIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M3.5 7h3c4.5 0 6.5 10 11 10h3M3.5 17h3c1.6 0 2.8-1.3 3.8-3M13.7 10c1-1.7 2.2-3 3.8-3h3" />
    <path d="m18 4.5 2.5 2.5L18 9.5M18 14.5l2.5 2.5-2.5 2.5" />
  </Icon>
)

export const PhoneIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="7" y="3" width="10" height="18" rx="2.5" />
    <path d="M11 18h2" />
  </Icon>
)

export const TabletIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
    <path d="M11 18h2" />
  </Icon>
)

export const DesktopIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M9 20.5h6M12 16.5v4" />
  </Icon>
)
