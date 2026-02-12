import { useId } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function AuthHeroIllustration({
  size = 320,
  className,
  static: isStatic,
}: IllustrationProps) {
  const id = useId()
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const glowId = `${id}-light-glow`
  const beamGradId = `${id}-beam-grad`

  // Data grid dots
  const gridCols = 12
  const gridRows = 4
  const gridStartX = 60
  const gridStartY = 230
  const gridSpacing = 17

  // Convergence lines from grid edges toward the light source
  const lightY = 80
  const lightX = 160

  const convergenceLines = [
    { x1: 80, y1: 210, x2: lightX - 15, y2: lightY + 25 },
    { x1: 110, y1: 215, x2: lightX - 8, y2: lightY + 20 },
    { x1: 140, y1: 218, x2: lightX - 2, y2: lightY + 15 },
    { x1: 170, y1: 218, x2: lightX + 2, y2: lightY + 15 },
    { x1: 200, y1: 215, x2: lightX + 8, y2: lightY + 20 },
    { x1: 230, y1: 210, x2: lightX + 15, y2: lightY + 25 },
  ]

  // Light beams radiating from the source
  const beams = [
    { angle: -70, length: 60 },
    { angle: -50, length: 70 },
    { angle: -30, length: 55 },
    { angle: -10, length: 65 },
    { angle: 10, length: 65 },
    { angle: 30, length: 55 },
    { angle: 50, length: 70 },
    { angle: 70, length: 60 },
  ]

  // Sparkles around the light source
  const sparkles = [
    { x: 125, y: 55, size: 4, delay: 2.2 },
    { x: 195, y: 60, size: 3, delay: 2.4 },
    { x: 140, y: 35, size: 3.5, delay: 2.6 },
    { x: 185, y: 40, size: 2.5, delay: 2.8 },
    { x: 115, y: 80, size: 2, delay: 2.5 },
    { x: 205, y: 78, size: 2.5, delay: 2.7 },
    { x: 160, y: 25, size: 3, delay: 2.3 },
    { x: 145, y: 70, size: 2, delay: 2.9 },
    { x: 175, y: 68, size: 2, delay: 2.5 },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      fill="none"
      className={cn('illustration', className)}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={beamGradId} cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* === BOTTOM SECTION: Data grid === */}
      <m.g
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {Array.from({ length: gridRows }).map((_, row) =>
          Array.from({ length: gridCols }).map((_, col) => {
            const x = gridStartX + col * gridSpacing
            const y = gridStartY + row * gridSpacing
            const isRect = (row + col) % 3 === 0
            const delay = animate ? (row * gridCols + col) * 0.015 : 0
            return isRect ? (
              <m.rect
                key={`g-${row}-${col}`}
                x={x - 2}
                y={y - 2}
                width="4"
                height="4"
                rx="0.5"
                fill="hsl(var(--muted-foreground) / 0.3)"
                initial={animate ? { opacity: 0, scale: 0 } : undefined}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay }}
              />
            ) : (
              <m.circle
                key={`g-${row}-${col}`}
                cx={x}
                cy={y}
                r="1.5"
                fill="hsl(var(--muted-foreground) / 0.3)"
                initial={animate ? { opacity: 0, scale: 0 } : undefined}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay }}
              />
            )
          })
        )}
      </m.g>

      {/* === MIDDLE SECTION: Convergence lines === */}
      {convergenceLines.map((line, i) => (
        <m.line
          key={`conv-${i}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 0.8, delay: 0.8 + i * 0.08, ease: 'easeOut' }}
        />
      ))}

      {/* === TOP SECTION: Light beams === */}
      {beams.map((beam, i) => {
        const rad = (beam.angle * Math.PI) / 180
        const x2 = lightX + Math.sin(rad) * beam.length
        const y2 = lightY - Math.cos(rad) * beam.length
        return (
          <m.line
            key={`beam-${i}`}
            x1={lightX}
            y1={lightY}
            x2={x2}
            y2={y2}
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
            initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 0.6, delay: 1.6 + i * 0.06, ease: 'easeOut' }}
          />
        )
      })}

      {/* Central bright point */}
      <m.circle
        cx={lightX}
        cy={lightY}
        r="6"
        fill="hsl(var(--primary))"
        filter={`url(#${glowId})`}
        initial={animate ? { scale: 0, opacity: 0 } : undefined}
        animate={{ scale: 1, opacity: 0.9 }}
        transition={{ duration: 0.5, delay: 1.5, ease: 'easeOut' }}
      />
      <m.circle
        cx={lightX}
        cy={lightY}
        r="3"
        fill="hsl(var(--primary))"
        initial={animate ? { scale: 0 } : undefined}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.6 }}
      />

      {/* Outer glow pulse ring */}
      <m.circle
        cx={lightX}
        cy={lightY}
        r="18"
        stroke="hsl(var(--primary) / 0.2)"
        strokeWidth="1"
        fill="none"
        initial={animate ? { scale: 0.5, opacity: 0 } : undefined}
        animate={
          animate
            ? { scale: [0.8, 1.3, 0.8], opacity: [0, 0.5, 0] }
            : { scale: 1, opacity: 0.3 }
        }
        transition={
          animate
            ? { duration: 3, delay: 2, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* === SPARKLES === */}
      {sparkles.map((s, i) => (
        <m.g
          key={`sparkle-${i}`}
          initial={animate ? { opacity: 0, scale: 0 } : undefined}
          animate={
            animate
              ? { opacity: [0, 1, 0.6, 1], scale: [0, 1, 0.8, 1] }
              : { opacity: 0.7, scale: 1 }
          }
          transition={
            animate
              ? {
                  duration: 2.5,
                  delay: s.delay,
                  repeat: Infinity,
                  repeatType: 'reverse' as const,
                  ease: 'easeInOut',
                }
              : undefined
          }
        >
          {/* Diamond sparkle shape */}
          <path
            d={`M${s.x} ${s.y - s.size} L${s.x + s.size * 0.6} ${s.y} L${s.x} ${s.y + s.size} L${s.x - s.size * 0.6} ${s.y} Z`}
            fill="hsl(var(--primary))"
            opacity="0.7"
          />
        </m.g>
      ))}
    </svg>
  )
}
