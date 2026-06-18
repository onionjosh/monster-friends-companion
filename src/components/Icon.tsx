import type { CSSProperties, ReactNode } from 'react'

/**
 * Monster Friends icon set — curated line icons (24×24, round strokes) in the
 * Lucide idiom. Ships inline so the offline PWA needs no CDN. Replaces emoji.
 */

// TEMP: these line-icons render wrong, so fall back to emoji for now.
const EMOJI: Record<string, string> = {
  swords: '⚔️',
  sword: '🗡️',
  bow: '🏹',
  shield: '🛡️',
}

const P: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />,
  ghost: (
    <>
      <path d="M5 20v-8a7 7 0 0 1 14 0v8l-2.5-1.6L14 20l-2-1.6L10 20l-2.5-1.6L5 20Z" />
      <circle cx="9.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  roster: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M8.5 9h7M8.5 13h7M8.5 17h4" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5A2.5 2.5 0 0 1 20 21.5Z" />,
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0Z" />
      <path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5C3 10 5 11 7 11M17 6h2.5A1.5 1.5 0 0 1 21 7.5C21 10 19 11 17 11" />
      <path d="M10 13.5h4M9.5 20h5M12 13.5V20" />
    </>
  ),
  sword: <path d="M14.5 3H21v6.5L10 20.5l-2.5.5.5-2.5ZM6 15l3 3M4 20l2-2" />,
  swords: <path d="M14.5 3H20v5.5l-7 7M9.5 3H4v5.5l7 7M14 17l3 3 2-1 1-2-3-3M10 17l-3 3-2-1-1-2 3-3" />,
  bow: (
    <>
      <path d="M4 20 20 4M14 4h6v6" />
      <path d="M4 12a8 8 0 0 0 8 8" />
    </>
  ),
  shield: <path d="M12 3 5 5.5V11c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V5.5Z" />,
  skull: (
    <>
      <path d="M5 11a7 7 0 1 1 14 0c0 2-1 3-1 4v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2c0-1-1-2-1-4Z" />
      <circle cx="9" cy="11" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1.4" fill="currentColor" stroke="none" />
      <path d="M11 18v-2M13 18v-2" />
    </>
  ),
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />,
  star: <path d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 16.9 6.5 19.7l1.3-6.1L3.2 9.4l6.2-.7Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4" />,
  chevronLeft: <path d="M15 5 8 12l7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6" />
    </>
  ),
  printer: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="8" rx="2" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  party: <path d="m4 20 4.5-12 7.5 7.5L4 20ZM14 3v2M19 8h2M16.5 5.5 18 4M14 11l3 3M18.5 11.5l1.5-.5" />,
  check: <path d="m5 12 5 5 9-11" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  scroll: <path d="M6 4h11a2 2 0 0 1 2 2v1H8M6 4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2M8 8v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M10.5 12h6M10.5 15h6" />,
}

export type IconName = keyof typeof P

export function Icon({
  name,
  size = 22,
  strokeWidth = 2,
  className = '',
  style,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}) {
  const emoji = EMOJI[name as string]
  if (emoji) {
    return (
      <span
        className={className}
        role="img"
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: size,
          height: size,
          fontSize: size * 0.92,
          lineHeight: 1,
          verticalAlign: 'middle',
          ...style,
        }}
      >
        {emoji}
      </span>
    )
  }

  const glyph = P[name as string]
  if (!glyph) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {glyph}
    </svg>
  )
}
