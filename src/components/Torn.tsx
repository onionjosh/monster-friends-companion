import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'

/** Zine/poster pieces: hand-cut torn-edge shapes tilted at an angle. The hard
 *  offset shadow uses filter:drop-shadow so it follows the ripped silhouette. */

const CLIPS = ['var(--clip-torn-1)', 'var(--clip-torn-2)', 'var(--clip-torn-3)']
const TILTS: Record<string, string> = {
  sm: 'var(--tilt-sm)',
  md: 'var(--tilt-md)',
  rev: 'var(--tilt-rev)',
  none: '0deg',
}

type TornVariant = 'red' | 'cream' | 'gold'

interface TornButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: TornVariant
  size?: 'sm' | 'md'
  cut?: 1 | 2 | 3
  tilt?: keyof typeof TILTS
  leftIcon?: IconName
}

export function TornButton({
  children,
  variant = 'red',
  size = 'md',
  cut = 1,
  tilt = 'sm',
  leftIcon,
  className = '',
  style,
  ...rest
}: TornButtonProps) {
  const t = TILTS[tilt] ?? TILTS.sm
  const cls = ['mf-torn', `mf-torn--${variant}`, size === 'sm' ? 'mf-torn--sm' : 'mf-torn--btn', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      className={cls}
      style={{ clipPath: CLIPS[(cut - 1) % 3], transform: `rotate(${t})`, ['--_tilt' as string]: t, ...style }}
      {...rest}
    >
      {leftIcon && <Icon name={leftIcon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  )
}

/** Slashed flag tag (the gold PP / version tag). */
export function TornTag({
  children,
  variant = 'gold',
  tilt = 'rev',
  className = '',
  style,
}: {
  children: ReactNode
  variant?: TornVariant
  tilt?: keyof typeof TILTS
  className?: string
  style?: CSSProperties
}) {
  const t = TILTS[tilt] ?? TILTS.rev
  const cls = ['mf-torn', `mf-torn--${variant}`, 'mf-torn--tag', className].filter(Boolean).join(' ')
  return (
    <span className={cls} style={{ clipPath: 'var(--clip-tag)', transform: `rotate(${t})`, cursor: 'default', ...style }}>
      {children}
    </span>
  )
}

/** Ripped callout banner (the gold BETA box, the party total banner). */
export function TornCallout({
  eyebrow,
  children,
  variant = 'gold',
  tilt = 'md',
  className = '',
  style,
}: {
  eyebrow?: ReactNode
  children: ReactNode
  variant?: TornVariant
  tilt?: keyof typeof TILTS
  className?: string
  style?: CSSProperties
}) {
  const t = TILTS[tilt] ?? TILTS.md
  const cls = ['mf-torn', `mf-torn--${variant}`, 'mf-torn--callout', className].filter(Boolean).join(' ')
  return (
    <div className={cls} style={{ clipPath: 'var(--clip-callout)', transform: `rotate(${t})`, ...style }}>
      {eyebrow && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 'var(--text-2xs)',
            letterSpacing: 'var(--tracking-caps)',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          {eyebrow}
        </span>
      )}
      <span style={{ fontSize: 'var(--text-lg)' }}>{children}</span>
    </div>
  )
}
