import type { CategorySlug } from '../lib/types'

interface IconProps {
  size?: number
  className?: string
}

function useProps({ size = 24, className }: IconProps): Record<string, string | number> {
  const props: Record<string, string | number> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }
  if (className) props.className = className
  return props
}

export function IconCarta({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <path d="M12 3l1.8 4.7L18.6 9l-4.8 1.3L12 15l-1.8-4.7L5.4 9l4.8-1.3L12 3z" />
      <path d="M18.5 15.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" />
    </svg>
  )
}

export function IconCube({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4l8-4.6z" />
      <path d="M12 2.8v9.2" />
      <path d="M12 12l8-4.6" />
      <path d="M12 12l-8-4.6" />
      <path d="M4 7.4l8 4.6 8-4.6" />
    </svg>
  )
}

export function IconBoard({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" opacity="0.55" />
      <circle cx="7" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconMask({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <path d="M3 11c0-3 4-4.5 9-4.5s9 1.5 9 4.5c0 3-1.6 6-4.2 6-1.6 0-2.6-1.4-4.8-1.4S8.8 17 7.2 17C4.6 17 3 14 3 11z" />
      <circle cx="8.6" cy="11" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="11" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconHome({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

export function IconTerminal({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 9l3 3-3 3" />
      <path d="M12 15h5" />
    </svg>
  )
}

export function IconUsers({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 5.6a3 3 0 0 1 0 5.8" />
      <path d="M17.8 14.7c2 .8 3 2.6 3.2 4.8" />
    </svg>
  )
}

export function IconZap({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L13 2z" />
    </svg>
  )
}

export function IconDice({ size }: IconProps) {
  return (
    <svg {...useProps({ size })}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CategoryGlyph({ slug, size = 24 }: { slug: CategorySlug; size?: number }) {
  switch (slug) {
    case 'carte':
      return <IconCarta size={size} />
    case '3d':
      return <IconCube size={size} />
    case 'tavolo':
      return <IconBoard size={size} />
    case 'party':
      return <IconMask size={size} />
  }
}

export function IconBrand({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5l7 4v7l-7 4-7-4v-7l7-4z"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 6.5v7" stroke="var(--accent-2)" strokeWidth="1.6" />
      <path d="M12 13.5l7-4" stroke="var(--accent)" strokeWidth="1.6" />
      <path d="M12 13.5l-7-4" stroke="var(--accent)" strokeWidth="1.6" />
    </svg>
  )
}