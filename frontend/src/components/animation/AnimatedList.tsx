import { m, AnimatePresence, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedListProps {
  children: ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={cn(className)}>
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  )
}

// Disable GPU-accelerated layout reflow for items beyond this index to avoid jank
const MAX_LAYOUT_ITEMS = 30

interface AnimatedListItemProps {
  children: ReactNode
  layoutId: string
  index?: number
  className?: string
}

export function AnimatedListItem({
  children,
  layoutId,
  index = 0,
  className,
}: AnimatedListItemProps) {
  const reduced = useReducedMotion()
  const duration = reduced ? 0 : 0.3
  const delay = reduced ? 0 : Math.min(index * 0.05, 0.5)

  return (
    <m.div
      layout={index < MAX_LAYOUT_ITEMS}
      layoutId={layoutId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
        layout: { duration: 0.25, ease: 'easeInOut' },
      }}
      className={className}
    >
      {children}
    </m.div>
  )
}
