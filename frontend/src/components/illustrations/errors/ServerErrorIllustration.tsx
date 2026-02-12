import { useId } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function ServerErrorIllustration({
  size = 200,
  className,
  static: isStatic,
}: IllustrationProps) {
  const id = useId()
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const dur = 0.6
  const glowId = `${id}-spark-glow`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={cn('illustration', className)}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Left circuit line segment */}
      <m.path
        d="M20 100 L55 100 L65 85 L80 85"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />

      {/* Right circuit line segment */}
      <m.path
        d="M120 85 L135 85 L145 100 L180 100"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />

      {/* Circuit nodes — left side */}
      {[
        { cx: 35, cy: 100 },
        { cx: 60, cy: 92 },
        { cx: 75, cy: 85 },
      ].map((node, i) => (
        <m.circle
          key={`l-${i}`}
          cx={node.cx}
          cy={node.cy}
          r="3"
          fill="hsl(var(--muted-foreground) / 0.6)"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: dur * 0.3 + i * 0.1 }}
        />
      ))}

      {/* Circuit nodes — right side */}
      {[
        { cx: 125, cy: 85 },
        { cx: 140, cy: 92 },
        { cx: 165, cy: 100 },
      ].map((node, i) => (
        <m.circle
          key={`r-${i}`}
          cx={node.cx}
          cy={node.cy}
          r="3"
          fill="hsl(var(--muted-foreground) / 0.6)"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: dur * 0.3 + i * 0.1 }}
        />
      ))}

      {/* Break gap — broken ends */}
      <m.path
        d="M80 85 L88 85"
        stroke="hsl(var(--muted-foreground) / 0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 2"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: dur * 0.5 }}
      />
      <m.path
        d="M112 85 L120 85"
        stroke="hsl(var(--muted-foreground) / 0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 2"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: dur * 0.5 }}
      />

      {/* Spark/flash at break point */}
      <m.g
        filter={`url(#${glowId})`}
        initial={animate ? { opacity: 0, scale: 0 } : undefined}
        animate={
          animate
            ? { opacity: [0, 1, 0.6, 1], scale: [0, 1.2, 0.9, 1] }
            : { opacity: 1, scale: 1 }
        }
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        {/* Central spark */}
        <m.path
          d="M97 78 L100 85 L103 78"
          stroke="hsl(var(--destructive))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <m.path
          d="M97 92 L100 85 L103 92"
          stroke="hsl(var(--destructive))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Horizontal spark lines */}
        <m.line
          x1="92" y1="85" x2="96" y2="85"
          stroke="hsl(var(--destructive))"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <m.line
          x1="104" y1="85" x2="108" y2="85"
          stroke="hsl(var(--destructive))"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Spark center dot */}
        <circle cx="100" cy="85" r="2" fill="hsl(var(--destructive))" />
      </m.g>

      {/* Pulsing glow ring around break */}
      <m.circle
        cx="100"
        cy="85"
        r="12"
        stroke="hsl(var(--destructive) / 0.3)"
        strokeWidth="1"
        fill="none"
        initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
        animate={
          animate
            ? { scale: [0.8, 1.2, 0.8], opacity: [0, 0.6, 0] }
            : { scale: 1, opacity: 0.3 }
        }
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Scattered spark particles */}
      {[
        { cx: 90, cy: 72, r: 1, delay: 0.8 },
        { cx: 110, cy: 74, r: 1.2, delay: 1 },
        { cx: 94, cy: 98, r: 0.8, delay: 1.2 },
        { cx: 108, cy: 96, r: 1, delay: 0.9 },
      ].map((p, i) => (
        <m.circle
          key={`sp-${i}`}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="hsl(var(--destructive) / 0.6)"
          initial={animate ? { opacity: 0, scale: 0 } : undefined}
          animate={
            animate
              ? { opacity: [0, 1, 0], scale: [0, 1, 0] }
              : { opacity: 0.6, scale: 1 }
          }
          transition={
            animate
              ? { duration: 2, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        />
      ))}

      {/* Decorative sub-lines — top */}
      <m.path
        d="M50 60 L70 60 L80 50"
        stroke="hsl(var(--muted-foreground) / 0.25)"
        strokeWidth="1"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.4 }}
      />
      <m.path
        d="M120 50 L130 60 L155 60"
        stroke="hsl(var(--muted-foreground) / 0.25)"
        strokeWidth="1"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.4 }}
      />

      {/* Decorative sub-lines — bottom */}
      <m.path
        d="M45 125 L65 125 L75 115"
        stroke="hsl(var(--muted-foreground) / 0.25)"
        strokeWidth="1"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.6 }}
      />
      <m.path
        d="M125 115 L135 125 L160 125"
        stroke="hsl(var(--muted-foreground) / 0.25)"
        strokeWidth="1"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.6 }}
      />
    </svg>
  )
}
