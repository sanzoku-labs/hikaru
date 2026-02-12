import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function EmptyHistorySpot({ size = 160, className, static: isStatic }: IllustrationProps) {
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const dur = animate ? 0.6 : 0

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
      {/* Clock face */}
      <m.circle
        cx="80"
        cy="80"
        r="40"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        fill="hsl(var(--muted-foreground) / 0.08)"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />
      {/* Hour marks */}
      <line x1="80" y1="44" x2="80" y2="48" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
      <line x1="80" y1="112" x2="80" y2="116" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
      <line x1="44" y1="80" x2="48" y2="80" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
      <line x1="112" y1="80" x2="116" y2="80" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
      {/* Clock hands */}
      <m.line
        x1="80" y1="80" x2="80" y2="56"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round"
        initial={animate ? { rotate: -30 } : undefined}
        animate={{ rotate: 0 }}
        transition={{ duration: dur * 0.8, delay: dur * 0.5 }}
        style={{ transformOrigin: '80px 80px' }}
      />
      <m.line
        x1="80" y1="80" x2="100" y2="72"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"
        initial={animate ? { rotate: -20 } : undefined}
        animate={{ rotate: 0 }}
        transition={{ duration: dur * 0.6, delay: dur * 0.6 }}
        style={{ transformOrigin: '80px 80px' }}
      />
      {/* Center dot */}
      <circle cx="80" cy="80" r="3" fill="hsl(var(--primary))" />
      {/* Fading data trail */}
      <m.path
        d="M36 80a44 44 0 0 1 12-30"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.4"
        fill="none"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, delay: dur * 0.3 }}
      />
      {/* Trail dots */}
      <circle cx="38" cy="72" r="2" fill="hsl(var(--muted-foreground))" opacity="0.3" />
      <circle cx="42" cy="58" r="1.5" fill="hsl(var(--muted-foreground))" opacity="0.2" />
      <circle cx="50" cy="48" r="1" fill="hsl(var(--muted-foreground))" opacity="0.15" />
    </svg>
  )
}
