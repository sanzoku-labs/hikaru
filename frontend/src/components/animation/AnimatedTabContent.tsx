import { m, AnimatePresence, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface AnimatedTabContentProps {
  activeTab: string
  children: ReactNode
  className?: string
}

export function AnimatedTabContent({ activeTab, children, className }: AnimatedTabContentProps) {
  const reduced = useReducedMotion()
  const duration = reduced ? 0 : 0.15

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={activeTab}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration, ease: 'easeInOut' }}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}
