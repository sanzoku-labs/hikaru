import { cn } from '@/lib/utils'
import type { PatternProps } from '../types'
import { DotGrid } from './DotGrid'
import { TopographicLines } from './TopographicLines'
import { CircuitBoard } from './CircuitBoard'

interface PatternOverlayProps extends PatternProps {
  pattern: 'dots' | 'topographic' | 'circuit'
  children: React.ReactNode
}

export function PatternOverlay({
  pattern,
  children,
  className,
  ...patternProps
}: PatternOverlayProps) {
  const Pattern =
    pattern === 'dots'
      ? DotGrid
      : pattern === 'topographic'
        ? TopographicLines
        : CircuitBoard

  return (
    <div className={cn('relative', className)}>
      <Pattern {...patternProps} />
      <div className="relative">{children}</div>
    </div>
  )
}
