import { useId } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function NotFoundIllustration({
  size = 200,
  className,
  static: isStatic,
}: IllustrationProps) {
  const id = useId()
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const dur = 0.6
  const glowId = `${id}-glow`

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
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background "404" text */}
      <m.text
        x="100"
        y="120"
        textAnchor="middle"
        fontSize="72"
        fontWeight="800"
        fill="hsl(var(--foreground) / 0.1)"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: dur }}
      >
        404
      </m.text>

      {/* Compass outer ring */}
      <m.circle
        cx="100"
        cy="90"
        r="40"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="2"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />

      {/* Compass inner ring */}
      <m.circle
        cx="100"
        cy="90"
        r="34"
        stroke="hsl(var(--muted-foreground) / 0.4)"
        strokeWidth="1"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, delay: 0.1 }}
      />

      {/* Cardinal direction ticks — N */}
      <line
        x1="100" y1="50" x2="100" y2="56"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"
      />
      {/* S */}
      <line
        x1="100" y1="124" x2="100" y2="130"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"
      />
      {/* E */}
      <line
        x1="140" y1="90" x2="134" y2="90"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"
      />
      {/* W */}
      <line
        x1="60" y1="90" x2="66" y2="90"
        stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"
      />

      {/* Cardinal letters */}
      <text
        x="100" y="65" textAnchor="middle" fontSize="8" fontWeight="600"
        fill="hsl(var(--muted-foreground))"
      >
        N
      </text>
      <text
        x="100" y="121" textAnchor="middle" fontSize="8" fontWeight="600"
        fill="hsl(var(--muted-foreground))"
      >
        S
      </text>
      <text
        x="128" y="93" textAnchor="middle" fontSize="8" fontWeight="600"
        fill="hsl(var(--muted-foreground))"
      >
        E
      </text>
      <text
        x="72" y="93" textAnchor="middle" fontSize="8" fontWeight="600"
        fill="hsl(var(--muted-foreground))"
      >
        W
      </text>

      {/* Compass needle — pointing confused NE-ish direction */}
      <m.g
        style={{ originX: '100px', originY: '90px' }}
        initial={animate ? { rotate: -30 } : undefined}
        animate={animate ? { rotate: [-30, -20, -35, -25, -30] } : { rotate: -30 }}
        transition={animate ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        {/* North half (primary color) */}
        <m.path
          d="M100 90 L96 88 L100 58 L104 88 Z"
          fill="hsl(var(--primary))"
          filter={`url(#${glowId})`}
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: dur, delay: dur * 0.5 }}
        />
        {/* South half */}
        <m.path
          d="M100 90 L96 92 L100 118 L104 92 Z"
          fill="hsl(var(--muted-foreground) / 0.5)"
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: dur, delay: dur * 0.5 }}
        />
      </m.g>

      {/* Center pin */}
      <circle cx="100" cy="90" r="3" fill="hsl(var(--muted-foreground))" />

      {/* Broken/dashed trail path below compass */}
      <m.path
        d="M40 160 Q60 150 75 155 Q85 158 90 155"
        stroke="hsl(var(--muted-foreground) / 0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 4"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.7 }}
      />
      {/* Gap in the trail */}
      <m.path
        d="M110 155 Q120 150 135 158 Q150 165 165 155"
        stroke="hsl(var(--muted-foreground) / 0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 4"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.9 }}
      />

      {/* Question mark dots near the trail gap */}
      <m.circle
        cx="98" cy="158" r="1.5" fill="hsl(var(--primary) / 0.6)"
        initial={animate ? { opacity: 0, scale: 0 } : undefined}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: dur * 1.1 }}
      />
      <m.circle
        cx="105" cy="156" r="1" fill="hsl(var(--primary) / 0.4)"
        initial={animate ? { opacity: 0, scale: 0 } : undefined}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: dur * 1.2 }}
      />
    </svg>
  )
}
