import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function EmptyProjectsSpot({ size = 160, className, static: isStatic }: IllustrationProps) {
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
      {/* Folder body */}
      <m.rect
        x="28"
        y="56"
        width="104"
        height="72"
        rx="8"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        fill="hsl(var(--muted-foreground) / 0.2)"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />
      {/* Folder tab */}
      <m.path
        d="M28 64V52a8 8 0 0 1 8-8h24l8 12"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        fill="hsl(var(--muted-foreground) / 0.15)"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, delay: dur * 0.3 }}
      />
      {/* Inner lines */}
      <line x1="48" y1="80" x2="112" y2="80" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="48" y1="92" x2="96" y2="92" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="48" y1="104" x2="80" y2="104" stroke="hsl(var(--border))" strokeWidth="1.5" />
      {/* Plus icon */}
      <m.g
        initial={animate ? { opacity: 0, y: 6 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur, delay: dur * 0.6 }}
      >
        <m.line
          x1="80" y1="24" x2="80" y2="40"
          stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
        />
        <m.line
          x1="72" y1="32" x2="88" y2="32"
          stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
        />
      </m.g>
      {/* Sparkle dots */}
      <m.circle
        cx="64" cy="28" r="1.5" fill="hsl(var(--primary))"
        initial={animate ? { opacity: 0, scale: 0 } : undefined}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: dur * 0.8 }}
      />
      <m.circle
        cx="96" cy="24" r="1" fill="hsl(var(--primary))"
        initial={animate ? { opacity: 0, scale: 0 } : undefined}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: dur * 0.9 }}
      />
    </svg>
  )
}
