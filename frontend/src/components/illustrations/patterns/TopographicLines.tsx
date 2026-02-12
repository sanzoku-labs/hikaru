import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { PatternProps } from '../types'

const lines = [
  { d: 'M0 15 Q25 5 50 18 T100 12', strokeWidth: 1.5, opacityScale: 1 },
  { d: 'M0 30 Q30 20 60 33 T120 27', strokeWidth: 1, opacityScale: 0.7 },
  { d: 'M0 48 Q35 38 70 50 T140 44', strokeWidth: 1.3, opacityScale: 0.85 },
  { d: 'M0 62 Q20 55 45 65 T100 60', strokeWidth: 0.8, opacityScale: 0.6 },
  { d: 'M0 78 Q40 68 80 80 T160 74', strokeWidth: 1.4, opacityScale: 0.9 },
  { d: 'M0 92 Q28 85 58 95 T120 90', strokeWidth: 0.9, opacityScale: 0.65 },
]

export function TopographicLines({
  density = 'normal',
  opacity = 0.15,
  className,
}: PatternProps) {
  const id = useId()
  const tileH = density === 'sparse' ? 140 : density === 'dense' ? 80 : 110
  const count = density === 'sparse' ? 3 : density === 'dense' ? 6 : 5
  const visibleLines = lines.slice(0, count)

  return (
    <svg
      className={cn('absolute inset-0 h-full w-full pointer-events-none', className)}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={`${id}-topo`}
          width="200"
          height={tileH}
          patternUnits="userSpaceOnUse"
        >
          {visibleLines.map((line, i) => (
            <path
              key={i}
              d={line.d}
              fill="none"
              stroke={i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
              strokeWidth={line.strokeWidth}
              opacity={line.opacityScale}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-topo)`} />
    </svg>
  )
}
