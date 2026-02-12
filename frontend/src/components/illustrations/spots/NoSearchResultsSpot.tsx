import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function NoSearchResultsSpot({
  size = 160,
  className,
  static: isStatic,
}: IllustrationProps) {
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
      {/* Lens circle */}
      <m.circle
        cx="72" cy="68" r="32"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2.5"
        fill="hsl(var(--muted-foreground) / 0.06)"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />
      {/* Handle */}
      <m.line
        x1="96" y1="92" x2="120" y2="116"
        stroke="hsl(var(--muted-foreground))" strokeWidth="4" strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.4, delay: dur * 0.5 }}
      />
      {/* Question mark */}
      <m.path
        d="M66 58a8 8 0 0 1 14 1c0 4-6 5-6 10"
        stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
        fill="none"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: dur * 0.6 }}
      />
      <m.circle
        cx="74" cy="78" r="1.5" fill="hsl(var(--primary))"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: dur * 0.8 }}
      />
      {/* Scattered dots */}
      <circle cx="36" cy="48" r="2" fill="hsl(var(--border))" opacity="0.5" />
      <circle cx="120" cy="44" r="1.5" fill="hsl(var(--border))" opacity="0.4" />
      <circle cx="44" cy="120" r="1.5" fill="hsl(var(--border))" opacity="0.35" />
      <circle cx="128" cy="72" r="2" fill="hsl(var(--border))" opacity="0.4" />
      <circle cx="52" cy="32" r="1" fill="hsl(var(--border))" opacity="0.3" />
      <circle cx="108" cy="128" r="1.5" fill="hsl(var(--border))" opacity="0.3" />
    </svg>
  )
}
