import { cn } from '@/lib/utils'
import type { PatternProps } from '../types'

export function DotGrid({ density = 'normal', opacity = 0.15, className }: PatternProps) {
  const gap = density === 'sparse' ? 28 : density === 'dense' ? 14 : 20
  const dotSize = density === 'dense' ? 1 : 1.2

  return (
    <div
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{
        opacity,
        backgroundImage: `radial-gradient(circle at center, hsl(var(--muted-foreground)) ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${gap}px ${gap}px`,
      }}
    />
  )
}
