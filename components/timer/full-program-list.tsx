'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { buildProgramRows } from '@/lib/timer/group-steps'
import { BLOCK_META, FALLBACK_STROKE_COLOR } from '@/lib/block-colors'
import { cn } from '@/lib/utils'
import type { TimerStep } from '@/lib/timer/flatten'

interface FullProgramListProps {
  steps: TimerStep[]
  stepIndex: number
}

export function FullProgramList({ steps, stepIndex }: FullProgramListProps) {
  const rows = buildProgramRows(steps, stepIndex)

  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {rows.map((row) => {
          if (row.kind === 'divider') {
            return (
              <motion.div
                key={row.key}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="px-2 pt-3 md:pt-4 pb-1 md:pb-1.5 text-[11px] md:text-xs font-medium uppercase tracking-wide text-muted-foreground/70 first:pt-0"
              >
                {row.label}
              </motion.div>
            )
          }

          const meta = BLOCK_META[row.blockType]
          const stroke = meta?.stroke ?? FALLBACK_STROKE_COLOR
          return (
            <motion.div
              key={row.key}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'flex items-center gap-2 md:gap-3 rounded-md px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border-l-2 border-transparent',
                row.isCurrent ? 'bg-foreground/5 font-semibold text-foreground' : 'text-muted-foreground'
              )}
              style={row.isCurrent ? { borderLeftColor: stroke } : undefined}
            >
              <span className="h-1.5 w-1.5 md:h-2 md:w-2 shrink-0 rounded-full" style={{ backgroundColor: stroke }} />
              <span className={cn('shrink-0 rounded border px-1 py-0.5 md:px-1.5 md:py-1 text-xs md:text-sm font-medium', meta?.badge)}>
                {meta?.label ?? row.blockType}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate">{row.exerciseName}</span>
                {row.setLabel && (
                  <span className="block truncate text-xs md:text-sm opacity-70">{row.setLabel}</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">{row.durationLabel}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
