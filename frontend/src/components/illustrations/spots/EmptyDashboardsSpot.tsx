import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function EmptyDashboardsSpot({
  size = 160,
  className,
  static: isStatic,
}: IllustrationProps) {
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const dur = animate ? 0.5 : 0

  const tiles = [
    { x: 24, y: 24, delay: 0 },
    { x: 88, y: 24, delay: 0.1 },
    { x: 24, y: 88, delay: 0.15 },
    { x: 88, y: 88, delay: 0.2 },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      className={cn('illustration', className)}
      role="img"
      aria-hidden="true"
    >
      {/* Glow */}
      <rect
        x="20" y="20" width="120" height="120" rx="12"
        fill="hsl(var(--primary))" opacity="0.04"
      />
      {/* Tile backgrounds */}
      {tiles.map((t, i) => (
        <m.rect
          key={i}
          x={t.x} y={t.y} width="52" height="52" rx="8"
          stroke="hsl(var(--border))" strokeWidth="1.5"
          fill="hsl(var(--muted-foreground) / 0.06)"
          initial={animate ? { opacity: 0, scale: 0.85 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: dur, delay: t.delay }}
          style={{ transformOrigin: `${t.x + 26}px ${t.y + 26}px` }}
        />
      ))}
      {/* Tile 1: mini bar chart */}
      <m.g
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: dur + 0.05 }}
      >
        <rect x="36" y="56" width="6" height="12" rx="1" fill="hsl(var(--primary))" opacity="0.5" />
        <rect x="46" y="48" width="6" height="20" rx="1" fill="hsl(var(--primary))" opacity="0.7" />
        <rect x="56" y="52" width="6" height="16" rx="1" fill="hsl(var(--primary))" opacity="0.6" />
      </m.g>
      {/* Tile 2: number */}
      <m.g
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: dur + 0.15 }}
      >
        <rect x="100" y="38" width="28" height="4" rx="2" fill="hsl(var(--border))" />
        <rect x="100" y="48" width="20" height="8" rx="2" fill="hsl(var(--primary))" opacity="0.5" />
        <rect x="100" y="62" width="16" height="3" rx="1.5" fill="hsl(var(--border))" opacity="0.6" />
      </m.g>
      {/* Tile 3: line spark */}
      <m.path
        d="M36 114 L46 108 L56 116 L64 104"
        stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round"
        fill="none" opacity="0.6"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: dur + 0.2 }}
      />
      {/* Tile 4: donut outline */}
      <m.circle
        cx="114" cy="114" r="14"
        stroke="hsl(var(--border))" strokeWidth="4" fill="none"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: dur + 0.25 }}
      />
      <m.path
        d="M114 100a14 14 0 0 1 12 21"
        stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
        fill="none" opacity="0.7"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: dur + 0.35 }}
      />
    </svg>
  )
}
