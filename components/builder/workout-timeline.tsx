'use client'

import type { BuilderBlock, BuilderPhase } from '@/types/builder'
import { cn } from '@/lib/utils'
import { BLOCK_META } from '@/lib/block-colors'

// ─── Duration calculation ──────────────────────────────────────────────────────

function calcBlockDuration(block: BuilderBlock): number | null {
  const c = block.config
  const exCount = block.exercises.length

  switch (block.block_type) {
    case 'hiit':
    case 'tabata': {
      const rounds = c.rounds ?? 1
      const workS = c.work_s ?? 20
      const restS = c.rest_s ?? 10
      return rounds * exCount * (workS + restS)
    }
    case 'amrap':
      return c.total_duration_s ?? null
    case 'emom':
      return c.total_duration_s ?? (c.interval_s ?? 60) * 10
    case 'circuit': {
      if (exCount === 0) return null
      const rounds = c.rounds ?? 1
      const restBetweenEx = c.rest_between_exercises_s ?? 0
      const restBetweenRounds = c.rest_between_rounds_s ?? 0
      const globalWork = c.work_s
      const exTotal = block.exercises.reduce(
        (sum, ex) => sum + (ex.duration_s ?? globalWork ?? 30),
        0
      )
      const roundDuration = exTotal + restBetweenEx * (exCount - 1)
      return rounds * roundDuration + restBetweenRounds * (rounds - 1)
    }
    case 'straight_sets':
      return null
    case 'free': {
      if (block.config.mode === 'reps') return null
      if (exCount === 0) return null
      const globalWork = block.config.work_s
      const globalRest = c.rest_between_exercises_s ?? 0
      const workTotal = block.exercises.reduce(
        (sum, ex) => sum + (ex.duration_s ?? globalWork ?? 30),
        0
      )
      const restTotal = block.exercises.slice(0, -1).reduce(
        (sum, ex) => sum + (ex.rest_after_s > 0 ? ex.rest_after_s : globalRest),
        0
      )
      return workTotal + restTotal
    }
    case 'rest':
      return c.rest_s && c.rest_s > 0 ? c.rest_s : 60
  }
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}


function blockSummary(block: BuilderBlock): string {
  const c = block.config
  switch (block.block_type) {
    case 'hiit':
    case 'tabata':
      return `${c.rounds ?? 1}r · ${c.work_s ?? 20}/${c.rest_s ?? 10}s`
    case 'amrap':
      return c.total_duration_s ? `${Math.round(c.total_duration_s / 60)} min` : ''
    case 'emom':
      return c.total_duration_s
        ? `${Math.round(c.total_duration_s / 60)} min`
        : `${c.interval_s ?? 60}s`
    case 'circuit':
      return `${c.rounds ?? 1} rounds${c.work_s ? ` · ${c.work_s}s` : ''}`
    case 'straight_sets':
      return `${c.sets ?? 3} sets`
    case 'free':
      if (c.mode === 'reps') return c.reps ? `${c.reps} reps/ex` : 'reps'
      return c.work_s ? `${c.work_s}s/ex` : 'timed'
    case 'rest':
      return c.rest_s ? `${c.rest_s}s` : ''
  }
}

const PHASE_LABELS: Record<string, string> = {
  warmup: 'Warm-Up', main: 'Main', cooldown: 'Cool-Down',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WorkoutTimelineProps {
  phases: BuilderPhase[]
}

export function WorkoutTimeline({ phases }: WorkoutTimelineProps) {
  const phaseData = phases.map((phase) => {
    const blocks = phase.blocks.map((block) => ({
      block,
      duration: calcBlockDuration(block),
    }))
    const phaseTotal = blocks.reduce((sum, { duration }) => sum + (duration ?? 0), 0)
    return { phase, blocks, phaseTotal }
  })

  const grandTotal = phaseData.reduce((sum, { phaseTotal }) => sum + phaseTotal, 0)
  const hasBlocks = phases.some((p) => p.blocks.length > 0)
  const timedBlocks = phaseData
    .flatMap(({ blocks }) => blocks)
    .filter(({ duration }) => duration !== null && duration > 0)

  return (
    <div className="border-t bg-card shrink-0">
      {/* Proportional color bar */}
      {grandTotal > 0 && (
        <div className="flex h-1 w-full">
          {timedBlocks.map(({ block, duration }) => (
            <div
              key={block.id}
              className={BLOCK_META[block.block_type]?.bar ?? 'bg-muted'}
              style={{ flex: (duration ?? 0) / grandTotal }}
            />
          ))}
        </div>
      )}

      <div className="px-6 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </span>
          {grandTotal > 0 && (
            <span className="text-sm font-medium tabular-nums">~{fmtDuration(grandTotal)}</span>
          )}
        </div>

        {!hasBlocks ? (
          <p className="text-xs text-muted-foreground py-1">Add blocks to see duration</p>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-1">
            {phaseData.map(({ phase, blocks, phaseTotal }) => {
              if (blocks.length === 0) return null
              return (
                <div key={phase.id} className="min-w-[160px] space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {PHASE_LABELS[phase.phase_type]}
                    </span>
                    {phaseTotal > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {fmtDuration(phaseTotal)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {blocks.map(({ block, duration }) => {
                      const meta = BLOCK_META[block.block_type]
                      return (
                        <div key={block.id} className="flex items-center gap-1.5">
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', meta?.bar)} />
                          <span className={cn(
                            'text-[10px] font-medium px-1 py-0.5 rounded border shrink-0',
                            meta?.badge
                          )}>
                            {meta?.label}
                          </span>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {blockSummary(block)}
                          </span>
                          <span className={cn(
                            'text-xs tabular-nums shrink-0',
                            duration !== null ? meta?.text : 'text-muted-foreground'
                          )}>
                            {duration !== null ? fmtDuration(duration) : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
