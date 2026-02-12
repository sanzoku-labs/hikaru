import { useId } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { IllustrationProps } from '../types'

export function WelcomeIllustration({
  size = 280,
  className,
  static: isStatic,
}: IllustrationProps) {
  const id = useId()
  const reduced = useReducedMotion()
  const animate = !isStatic && !reduced
  const glowId = `${id}-stage-glow`

  // Stage positions
  const stageY = 140
  const docX = 55
  const aiX = 140
  const chartX = 225

  // Timing
  const docDelay = 0.2
  const arrow1Delay = 0.8
  const aiDelay = 1.4
  const arrow2Delay = 2.0
  const chartDelay = 2.6

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 280 280"
      fill="none"
      className={cn('illustration', className)}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===== STAGE 1: Document/File icon ===== */}
      <m.g
        initial={animate ? { opacity: 0, y: 10 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: docDelay, ease: 'easeOut' }}
      >
        {/* Page shape */}
        <m.path
          d={`M${docX - 16} ${stageY - 22} H${docX + 8} L${docX + 16} ${stageY - 14} V${stageY + 22} H${docX - 16} Z`}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          fill="hsl(var(--muted-foreground) / 0.08)"
          strokeLinejoin="round"
        />
        {/* Fold corner */}
        <path
          d={`M${docX + 8} ${stageY - 22} V${stageY - 14} H${docX + 16}`}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Text lines */}
        <line
          x1={docX - 10} y1={stageY - 8} x2={docX + 10} y2={stageY - 8}
          stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth="1.5" strokeLinecap="round"
        />
        <line
          x1={docX - 10} y1={stageY} x2={docX + 6} y2={stageY}
          stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth="1.5" strokeLinecap="round"
        />
        <line
          x1={docX - 10} y1={stageY + 8} x2={docX + 8} y2={stageY + 8}
          stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth="1.5" strokeLinecap="round"
        />
        <line
          x1={docX - 10} y1={stageY + 16} x2={docX + 2} y2={stageY + 16}
          stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth="1.5" strokeLinecap="round"
        />
      </m.g>

      {/* Stage 1 label */}
      <m.text
        x={docX}
        y={stageY + 40}
        textAnchor="middle"
        fontSize="9"
        fill="hsl(var(--muted-foreground) / 0.6)"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: docDelay + 0.3 }}
      >
        Upload
      </m.text>

      {/* ===== ARROW 1: Document → AI ===== */}
      <m.g
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: arrow1Delay }}
      >
        <m.line
          x1={docX + 22}
          y1={stageY}
          x2={aiX - 26}
          y2={stageY}
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0 } : undefined}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: arrow1Delay }}
        />
        {/* Arrowhead */}
        <m.path
          d={`M${aiX - 30} ${stageY - 4} L${aiX - 24} ${stageY} L${aiX - 30} ${stageY + 4}`}
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: arrow1Delay + 0.4 }}
        />
      </m.g>

      {/* ===== STAGE 2: AI Brain/Node ===== */}
      <m.g
        initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: aiDelay, ease: 'easeOut' }}
      >
        {/* Outer circle */}
        <m.circle
          cx={aiX}
          cy={stageY}
          r="24"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          fill="hsl(var(--muted-foreground) / 0.05)"
        />

        {/* Inner connecting nodes */}
        {[
          { cx: aiX, cy: stageY - 10 },
          { cx: aiX - 10, cy: stageY + 6 },
          { cx: aiX + 10, cy: stageY + 6 },
          { cx: aiX - 5, cy: stageY - 3 },
          { cx: aiX + 5, cy: stageY - 3 },
          { cx: aiX, cy: stageY + 12 },
        ].map((node, i) => (
          <circle
            key={`node-${i}`}
            cx={node.cx}
            cy={node.cy}
            r="2"
            fill="hsl(var(--muted-foreground) / 0.7)"
          />
        ))}

        {/* Connections between nodes */}
        {[
          { x1: aiX, y1: stageY - 10, x2: aiX - 10, y2: stageY + 6 },
          { x1: aiX, y1: stageY - 10, x2: aiX + 10, y2: stageY + 6 },
          { x1: aiX - 10, y1: stageY + 6, x2: aiX + 10, y2: stageY + 6 },
          { x1: aiX - 5, y1: stageY - 3, x2: aiX + 5, y2: stageY - 3 },
          { x1: aiX - 5, y1: stageY - 3, x2: aiX, y2: stageY + 12 },
          { x1: aiX + 5, y1: stageY - 3, x2: aiX, y2: stageY + 12 },
        ].map((c, i) => (
          <line
            key={`conn-${i}`}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="hsl(var(--muted-foreground) / 0.3)"
            strokeWidth="1"
          />
        ))}

        {/* Active glow */}
        <m.circle
          cx={aiX}
          cy={stageY}
          r="28"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="1"
          fill="none"
          filter={`url(#${glowId})`}
          initial={animate ? { scale: 0.9, opacity: 0 } : undefined}
          animate={
            animate
              ? { scale: [0.9, 1.1, 0.9], opacity: [0.2, 0.5, 0.2] }
              : { scale: 1, opacity: 0.3 }
          }
          transition={
            animate
              ? { duration: 3, delay: aiDelay + 0.3, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        />
      </m.g>

      {/* Stage 2 label */}
      <m.text
        x={aiX}
        y={stageY + 40}
        textAnchor="middle"
        fontSize="9"
        fill="hsl(var(--muted-foreground) / 0.6)"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: aiDelay + 0.3 }}
      >
        Analyze
      </m.text>

      {/* ===== ARROW 2: AI → Chart ===== */}
      <m.g
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: arrow2Delay }}
      >
        <m.line
          x1={aiX + 28}
          y1={stageY}
          x2={chartX - 24}
          y2={stageY}
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0 } : undefined}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: arrow2Delay }}
        />
        {/* Arrowhead */}
        <m.path
          d={`M${chartX - 28} ${stageY - 4} L${chartX - 22} ${stageY} L${chartX - 28} ${stageY + 4}`}
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: arrow2Delay + 0.4 }}
        />
      </m.g>

      {/* ===== STAGE 3: Chart/Graph output ===== */}
      <m.g
        initial={animate ? { opacity: 0, y: 10 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: chartDelay, ease: 'easeOut' }}
      >
        {/* Chart frame */}
        <rect
          x={chartX - 20}
          y={stageY - 22}
          width="40"
          height="44"
          rx="3"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          fill="hsl(var(--muted-foreground) / 0.05)"
        />

        {/* Baseline */}
        <line
          x1={chartX - 14} y1={stageY + 14}
          x2={chartX + 14} y2={stageY + 14}
          stroke="hsl(var(--muted-foreground) / 0.4)"
          strokeWidth="1"
        />

        {/* Bar chart bars */}
        {[
          { x: chartX - 12, h: 14, color: 'hsl(var(--primary) / 0.5)' },
          { x: chartX - 4, h: 22, color: 'hsl(var(--primary) / 0.7)' },
          { x: chartX + 4, h: 18, color: 'hsl(var(--primary) / 0.6)' },
        ].map((bar, i) => (
          <m.rect
            key={`bar-${i}`}
            x={bar.x}
            y={stageY + 14 - bar.h}
            width="6"
            height={bar.h}
            rx="1"
            fill={bar.color}
            initial={animate ? { scaleY: 0 } : undefined}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 0.4,
              delay: chartDelay + 0.2 + i * 0.12,
              ease: 'easeOut',
            }}
            style={{ originY: '100%', originX: `${bar.x + 3}px`, transformBox: 'fill-box' }}
          />
        ))}

        {/* Trend line overlay */}
        <m.path
          d={`M${chartX - 12} ${stageY + 2} L${chartX - 2} ${stageY - 8} L${chartX + 10} ${stageY - 3}`}
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 0.5, delay: chartDelay + 0.6 }}
        />
      </m.g>

      {/* Stage 3 label */}
      <m.text
        x={chartX}
        y={stageY + 40}
        textAnchor="middle"
        fontSize="9"
        fill="hsl(var(--muted-foreground) / 0.6)"
        initial={animate ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: chartDelay + 0.3 }}
      >
        Insight
      </m.text>

      {/* Decorative dots along the journey path */}
      {[
        { cx: 90, cy: stageY - 30, r: 1.5, delay: 0.6 },
        { cx: 120, cy: stageY + 30, r: 1, delay: 1.2 },
        { cx: 175, cy: stageY - 28, r: 1, delay: 1.8 },
        { cx: 190, cy: stageY + 28, r: 1.5, delay: 2.4 },
      ].map((dot, i) => (
        <m.circle
          key={`dot-${i}`}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill="hsl(var(--primary) / 0.4)"
          initial={animate ? { opacity: 0, scale: 0 } : undefined}
          animate={
            animate
              ? { opacity: [0, 0.6, 0.3, 0.6], scale: [0, 1, 0.8, 1] }
              : { opacity: 0.5, scale: 1 }
          }
          transition={
            animate
              ? {
                  duration: 3,
                  delay: dot.delay,
                  repeat: Infinity,
                  repeatType: 'reverse' as const,
                  ease: 'easeInOut',
                }
              : undefined
          }
        />
      ))}
    </svg>
  )
}
