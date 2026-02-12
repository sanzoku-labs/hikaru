import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function EmptyFilesSpot({ size = 160, className, static: isStatic }: IllustrationProps) {
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
      {/* Document body */}
      <m.path
        d="M44 28h48l28 28v76a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8V36a8 8 0 0 1 8-8Z"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        fill="hsl(var(--muted-foreground) / 0.1)"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />
      {/* Dog-ear fold */}
      <m.path
        d="M92 28v20a8 8 0 0 0 8 8h20"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        fill="none"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.5, delay: dur * 0.4 }}
      />
      {/* Text lines */}
      <line x1="52" y1="76" x2="108" y2="76" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="52" y1="88" x2="100" y2="88" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="52" y1="100" x2="88" y2="100" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="52" y1="112" x2="96" y2="112" stroke="hsl(var(--border))" strokeWidth="1.5" />
      {/* Upload arrow */}
      <m.g
        initial={animate ? { opacity: 0, y: 10 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur * 0.6, delay: dur * 0.5 }}
      >
        <m.line
          x1="80" y1="68" x2="80" y2="40"
          stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
        />
        <m.path
          d="M72 48l8-8 8 8"
          stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          fill="none"
        />
      </m.g>
    </svg>
  )
}
