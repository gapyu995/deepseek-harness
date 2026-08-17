// Ellen (ZZZ) shark mascot: a chibi shark silhouette used as decorative brand
// art on the empty hero. The body ink rides currentColor; the eye, gills, and
// cheek ride the business accent token so the mascot tracks the Ellen red
// theme in both palettes.

import type { IconProps } from './icons/props.ts'

/**
 * Render the shark mascot.
 * @param props.size - width in px (default 72; height keeps the 80:48 ratio).
 * @param props.className - extra class for layout placement.
 * @returns the mascot svg (aria-hidden decorative art).
 */
export function SharkMascot({ size = 72, className }: IconProps) {
  const accent = { fill: 'var(--dsw-alias-state-business-primary)' }
  return (
    <svg
      width={size}
      height={(size * 48) / 80}
      className={className}
      viewBox="0 0 80 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 26 C4 18 12 10 24 10 C40 10 52 16 60 24 C52 32 40 38 24 38 C12 38 4 34 8 26 Z"
        fill="currentColor"
      />
      <path d="M60 24 L74 14 L70 24 L74 34 L60 26 Z" fill="currentColor" />
      <path d="M30 12 C33 4 44 2 48 9 C42 10 36 11 30 12 Z" fill="currentColor" />
      <path d="M30 34 C34 38 40 40 44 40 C38 42 32 42 27 38 Z" fill="currentColor" />
      <circle cx="19" cy="23" r="2.6" style={accent} />
      <path
        d="M40 21 C37 21 36 23 36 25 M40 27 C37 27 36 29 36 31"
        style={{ stroke: 'var(--dsw-alias-state-business-primary)', strokeWidth: 1.6, strokeLinecap: 'round' }}
      />
      <circle cx="31" cy="31" r="2.4" style={{ fill: 'var(--dsw-alias-state-business-primary)', opacity: 0.35 }} />
    </svg>
  )
}
