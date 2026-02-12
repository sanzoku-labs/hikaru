import { useId } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function EmptyReportsSpot({ size = 160, className, static: isStatic }: IllustrationProps) {
  const id = useId()
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
      <defs>
        <linearGradient id={`${id}-shimmer`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          {animate && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-1 -1"
              to="1 1"
              dur="2.5s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
      </defs>
      {/* Back page */}
      <m.rect
        x="48" y="24" width="76" height="100" rx="6"
        stroke="hsl(var(--border))" strokeWidth="1.5"
        fill="hsl(var(--muted-foreground) / 0.06)"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur * 0.4 }}
      />
      {/* Middle page */}
      <m.rect
        x="40" y="32" width="76" height="100" rx="6"
        stroke="hsl(var(--border))" strokeWidth="1.5"
        fill="hsl(var(--muted-foreground) / 0.08)"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur * 0.5, delay: dur * 0.15 }}
      />
      {/* Front page */}
      <m.rect
        x="32" y="40" width="76" height="100" rx="6"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2"
        fill="hsl(var(--muted-foreground) / 0.1)"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.3 }}
      />
      {/* Shimmer overlay */}
      <rect
        x="32" y="40" width="76" height="100" rx="6"
        fill={`url(#${id}-shimmer)`}
      />
      {/* Text lines on front page */}
      <line x1="44" y1="60" x2="96" y2="60" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="44" y1="72" x2="88" y2="72" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="44" y1="84" x2="92" y2="84" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="44" y1="96" x2="76" y2="96" stroke="hsl(var(--border))" strokeWidth="1.5" />
      {/* Title bar accent */}
      <rect x="44" y="50" width="24" height="3" rx="1.5" fill="hsl(var(--primary))" opacity="0.6" />
    </svg>
  )
}
