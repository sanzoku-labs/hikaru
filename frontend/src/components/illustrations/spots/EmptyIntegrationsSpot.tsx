import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function EmptyIntegrationsSpot({
  size = 160,
  className,
  static: isStatic,
}: IllustrationProps) {
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const dur = animate ? 0.6 : 0

  // Triangle arrangement: top-center, bottom-left, bottom-right
  const nodes = [
    { cx: 80, cy: 40 },
    { cx: 44, cy: 116 },
    { cx: 116, cy: 116 },
  ] as const

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
      {/* Connection lines */}
      <m.line
        x1={80} y1={40} x2={44} y2={116}
        stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="6 4"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.6 }}
      />
      <m.line
        x1={80} y1={40} x2={116} y2={116}
        stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="6 4"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.6, delay: dur * 0.15 }}
      />
      <m.line
        x1={44} y1={116} x2={116} y2={116}
        stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="6 4"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.6, delay: dur * 0.3 }}
      />
      {/* Nodes */}
      {nodes.map((n, i) => (
        <m.circle
          key={i}
          cx={n.cx} cy={n.cy} r="20"
          stroke="hsl(var(--muted-foreground))" strokeWidth="2"
          fill="hsl(var(--muted-foreground) / 0.08)"
          initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: dur * 0.4 + i * 0.1 }}
          style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
        />
      ))}
      {/* Gear icon in top node */}
      <m.path
        d="M80 34a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-2-2v-1m4 0v1m5.5 3.5.7-.7m-15.4 8.4-.7.7m15.4 0 .7.7m-15.4-8.4-.7-.7m16.9 5h1m-18 0h-1"
        stroke="hsl(var(--primary))" strokeWidth="1.2" fill="none"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: dur * 0.6 }}
      />
      {/* Circle icon in bottom-left node */}
      <circle cx="44" cy="116" r="6" stroke="hsl(var(--primary))" strokeWidth="1.2" fill="none" />
      <circle cx="44" cy="116" r="2" fill="hsl(var(--primary))" opacity="0.5" />
      {/* Plus icon in bottom-right node */}
      <line x1="110" y1="116" x2="122" y2="116" stroke="hsl(var(--primary))" strokeWidth="1.2" />
      <line x1="116" y1="110" x2="116" y2="122" stroke="hsl(var(--primary))" strokeWidth="1.2" />
    </svg>
  )
}
