'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { groupUpcomingSteps } from '@/lib/timer/group-steps'
import { BLOCK_META, FALLBACK_STROKE_COLOR } from '@/lib/block-colors'
import { cn } from '@/lib/utils'
import type { TimerStep } from '@/lib/timer/flatten'

interface UpcomingListProps {
  steps: TimerStep[]
  stepIndex: number
}

export function UpcomingList({ steps, stepIndex }: UpcomingListProps) {
  const groups = groupUpcomingSteps(steps, stepIndex)

  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {groups.map((group) => {
          const meta = BLOCK_META[group.blockType]
          const stroke = meta?.stroke ?? FALLBACK_STROKE_COLOR
          return (
            <motion.div
              key={group.key}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs border-l-2 border-transparent',
                group.isCurrent ? 'bg-foreground/5 font-semibold text-foreground' : 'text-muted-foreground'
              )}
              style={group.isCurrent ? { borderLeftColor: stroke } : undefined}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: stroke }} />
              <span className={cn('shrink-0 rounded border px-1 py-0.5 text-[10px] font-medium', meta?.badge)}>
                {meta?.label ?? group.blockType}
              </span>
              <span className="flex-1 truncate">{group.exerciseName}</span>
              <span className="shrink-0 tabular-nums">{group.durationLabel}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
