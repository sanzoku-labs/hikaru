import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function EmptyAnalyticsSpot({ size = 160, className, static: isStatic }: IllustrationProps) {
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
      {/* Y axis */}
      <m.line
        x1="36" y1="28" x2="36" y2="128"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.5 }}
      />
      {/* X axis */}
      <m.line
        x1="36" y1="128" x2="136" y2="128"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.5, delay: dur * 0.2 }}
      />
      {/* Ghost bars */}
      <rect x="50" y="104" width="12" height="24" rx="2" fill="hsl(var(--border))" opacity="0.4" />
      <rect x="74" y="92" width="12" height="36" rx="2" fill="hsl(var(--border))" opacity="0.4" />
      <rect x="98" y="100" width="12" height="28" rx="2" fill="hsl(var(--border))" opacity="0.4" />
      {/* Rising trend line */}
      <m.path
        d="M48 100 L72 84 L96 72 L120 48"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeDasharray="6 4"
        strokeLinecap="round"
        fill="none"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.8, delay: dur * 0.5 }}
      />
      {/* Data points */}
      {[
        { cx: 48, cy: 100 },
        { cx: 72, cy: 84 },
        { cx: 96, cy: 72 },
        { cx: 120, cy: 48 },
      ].map((pt, i) => (
        <m.circle
          key={i}
          cx={pt.cx}
          cy={pt.cy}
          r="4"
          fill="hsl(var(--primary))"
          initial={animate ? { opacity: 0, scale: 0 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: dur * 0.6 + i * 0.1 }}
        />
      ))}
      {/* Grid lines */}
      <line x1="36" y1="80" x2="136" y2="80" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
      <line x1="36" y1="56" x2="136" y2="56" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
    </svg>
  )
}
