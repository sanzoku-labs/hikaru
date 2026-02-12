import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { PatternProps } from '../types'

const nodes = [
  { x: 20, y: 20 },
  { x: 60, y: 20 },
  { x: 60, y: 50 },
  { x: 20, y: 50 },
  { x: 40, y: 35 },
  { x: 80, y: 35 },
  { x: 80, y: 65 },
  { x: 40, y: 65 },
  { x: 10, y: 75 },
  { x: 50, y: 80 },
  { x: 90, y: 15 },
  { x: 90, y: 85 },
] as const

const segments = [
  { from: { x: 20, y: 20 }, to: { x: 60, y: 20 } },
  { from: { x: 60, y: 20 }, to: { x: 60, y: 50 } },
  { from: { x: 60, y: 50 }, to: { x: 20, y: 50 } },
  { from: { x: 20, y: 50 }, to: { x: 20, y: 20 } },
  { from: { x: 40, y: 35 }, to: { x: 80, y: 35 } },
  { from: { x: 80, y: 35 }, to: { x: 80, y: 65 } },
  { from: { x: 80, y: 65 }, to: { x: 40, y: 65 } },
  { from: { x: 40, y: 65 }, to: { x: 40, y: 35 } },
  { from: { x: 10, y: 75 }, to: { x: 10, y: 50 } },
  { from: { x: 50, y: 80 }, to: { x: 90, y: 80 } },
  { from: { x: 90, y: 15 }, to: { x: 90, y: 35 } },
  { from: { x: 90, y: 85 }, to: { x: 50, y: 85 } },
] as const

export function CircuitBoard({
  density = 'normal',
  opacity = 0.15,
  className,
}: PatternProps) {
  const id = useId()
  const size = density === 'sparse' ? 160 : density === 'dense' ? 80 : 120
  const nodeRadius = density === 'dense' ? 2.5 : 2
  const count = density === 'sparse' ? 6 : density === 'dense' ? 12 : 9
  const visibleNodes = nodes.slice(0, count)
  const visibleSegments = segments.slice(0, count)

  return (
    <svg
      className={cn('absolute inset-0 h-full w-full pointer-events-none', className)}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={`${id}-circuit`}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          {visibleSegments.map((seg, i) => (
            <line
              key={`l-${i}`}
              x1={`${seg.from.x}%`}
              y1={`${seg.from.y}%`}
              x2={`${seg.to.x}%`}
              y2={`${seg.to.y}%`}
              stroke="hsl(var(--border))"
              strokeWidth={1.2}
            />
          ))}
          {visibleNodes.map((node, i) => (
            <circle
              key={`n-${i}`}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={nodeRadius}
              fill="hsl(var(--primary))"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-circuit)`} />
    </svg>
  )
}
