import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const reduced = useReducedMotion()
  const duration = reduced ? 0 : 0.2

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </m.div>
  )
}
