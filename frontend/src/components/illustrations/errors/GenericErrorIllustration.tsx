import { useId } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function GenericErrorIllustration({
  size = 200,
  className,
  static: isStatic,
}: IllustrationProps) {
  const id = useId()
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const dur = 0.6
  const glowId = `${id}-warn-glow`

  const fragments = [
    { type: 'rect', x: 42, y: 50, size: 6, rotation: 15, delay: 0.7 },
    { type: 'circle', x: 155, y: 65, size: 4, rotation: 0, delay: 0.8 },
    { type: 'tri', x: 50, y: 135, size: 7, rotation: -20, delay: 0.9 },
    { type: 'rect', x: 158, y: 130, size: 5, rotation: 40, delay: 0.75 },
    { type: 'circle', x: 38, y: 95, size: 3, rotation: 0, delay: 0.85 },
    { type: 'tri', x: 162, y: 95, size: 5, rotation: 25, delay: 0.95 },
    { type: 'rect', x: 75, y: 38, size: 4, rotation: -30, delay: 0.65 },
    { type: 'circle', x: 130, y: 150, size: 3.5, rotation: 0, delay: 1.0 },
  ]

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
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Warning triangle outline */}
      <m.path
        d="M100 52 L148 140 H52 Z"
        stroke="hsl(var(--destructive) / 0.8)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${glowId})`}
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, ease: 'easeOut' }}
      />

      {/* Inner triangle fill (very subtle) */}
      <m.path
        d="M100 58 L144 137 H56 Z"
        fill="hsl(var(--destructive) / 0.06)"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: dur, delay: dur * 0.3 }}
      />

      {/* Exclamation mark — stem */}
      <m.line
        x1="100" y1="82" x2="100" y2="112"
        stroke="hsl(var(--destructive) / 0.8)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: dur * 0.5 }}
      />

      {/* Exclamation mark — dot */}
      <m.circle
        cx="100"
        cy="124"
        r="2.5"
        fill="hsl(var(--destructive) / 0.8)"
        initial={animate ? { scale: 0, opacity: 0 } : undefined}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: dur * 0.7 }}
      />

      {/* Scattered geometric fragments */}
      {fragments.map((frag, i) => {
        const driftX = (frag.x > 100 ? 1 : -1) * 4
        const driftY = (frag.y > 100 ? 1 : -1) * 4

        return (
          <m.g
            key={i}
            initial={
              animate
                ? { opacity: 0, x: 0, y: 0, rotate: 0 }
                : undefined
            }
            animate={
              animate
                ? {
                    opacity: [0, 0.7, 0.5],
                    x: [0, driftX],
                    y: [0, driftY],
                    rotate: [0, frag.rotation],
                  }
                : { opacity: 0.5 }
            }
            transition={
              animate
                ? {
                    duration: 3,
                    delay: frag.delay,
                    repeat: Infinity,
                    repeatType: 'reverse' as const,
                    ease: 'easeInOut',
                  }
                : undefined
            }
          >
            {frag.type === 'rect' && (
              <rect
                x={frag.x - frag.size / 2}
                y={frag.y - frag.size / 2}
                width={frag.size}
                height={frag.size}
                stroke="hsl(var(--destructive) / 0.4)"
                strokeWidth="1"
                fill="none"
              />
            )}
            {frag.type === 'circle' && (
              <circle
                cx={frag.x}
                cy={frag.y}
                r={frag.size}
                stroke="hsl(var(--destructive) / 0.4)"
                strokeWidth="1"
                fill="none"
              />
            )}
            {frag.type === 'tri' && (
              <path
                d={`M${frag.x} ${frag.y - frag.size} L${frag.x + frag.size} ${frag.y + frag.size / 2} L${frag.x - frag.size} ${frag.y + frag.size / 2} Z`}
                stroke="hsl(var(--destructive) / 0.4)"
                strokeWidth="1"
                fill="none"
              />
            )}
          </m.g>
        )
      })}

      {/* Subtle pulsing glow behind the triangle */}
      <m.path
        d="M100 48 L152 144 H48 Z"
        stroke="hsl(var(--destructive) / 0.15)"
        strokeWidth="6"
        strokeLinejoin="round"
        fill="none"
        initial={animate ? { opacity: 0 } : undefined}
        animate={
          animate
            ? { opacity: [0, 0.4, 0] }
            : { opacity: 0.2 }
        }
        transition={
          animate
            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />
    </svg>
  )
}
