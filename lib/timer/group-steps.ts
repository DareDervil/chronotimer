import { BLOCK_META } from '@/lib/block-colors'
import type { TimerStep } from './flatten'

export interface StepGroup {
  key: string
  blockType: string
  exerciseName: string
  durationLabel: string  // e.g. "20s", "1:30", "10 reps" — static, not a live countdown
  isCurrent: boolean
}

function formatDurationLabel(step: TimerStep): string {
  if (step.isReps) return step.repsDisplay ?? ''
  const seconds = step.duration
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  return `${seconds}s`
}

function groupKey(step: TimerStep): string {
  return `${step.blockId}:${step.bexId ?? 'block'}`
}

export function groupUpcomingSteps(steps: TimerStep[], stepIndex: number): StepGroup[] {
  interface Accum { blockType: string; exerciseName: string; durationLabel: string; lastIndex: number }
  const groups = new Map<string, Accum>()

  steps.forEach((step, i) => {
    if (step.isRest) return
    const key = groupKey(step)
    const existing = groups.get(key)
    if (existing) {
      existing.lastIndex = i
    } else {
      groups.set(key, {
        blockType: step.blockType,
        exerciseName: step.exerciseName,
        durationLabel: formatDurationLabel(step),
        lastIndex: i,
      })
    }
  })

  const currentStep = steps[stepIndex]
  const currentKey = currentStep && !currentStep.isRest ? groupKey(currentStep) : null

  const current: StepGroup[] = []
  const upcoming: StepGroup[] = []

  for (const [key, g] of groups) {
    if (g.lastIndex < stepIndex) continue
    const row: StepGroup = {
      key,
      blockType: g.blockType,
      exerciseName: g.exerciseName,
      durationLabel: g.durationLabel,
      isCurrent: key === currentKey,
    }
    if (row.isCurrent) current.push(row)
    else upcoming.push(row)
  }

  return [...current, ...upcoming]
}

export type ProgramRow =
  | { kind: 'divider'; key: string; label: string }
  | {
      kind: 'step'
      key: string
      blockType: string
      exerciseName: string
      setLabel: string
      durationLabel: string
      isRest: boolean
      isCurrent: boolean
    }

export function buildProgramRows(steps: TimerStep[], stepIndex: number): ProgramRow[] {
  const rows: ProgramRow[] = []
  let prevBlockId: string | null = null
  let prevPhaseLabel: string | null = null

  for (let i = stepIndex; i < steps.length; i++) {
    const step = steps[i]

    if (step.blockId !== prevBlockId || step.phaseLabel !== prevPhaseLabel) {
      const meta = BLOCK_META[step.blockType]
      rows.push({
        kind: 'divider',
        key: `divider-${step.id}`,
        label: `${step.phaseLabel} · ${meta?.label ?? step.blockType}`,
      })
      prevBlockId = step.blockId
      prevPhaseLabel = step.phaseLabel
    }

    rows.push({
      kind: 'step',
      key: step.id,
      blockType: step.isRest ? 'rest' : step.blockType,
      exerciseName: step.exerciseName,
      setLabel: step.label,
      durationLabel: formatDurationLabel(step),
      isRest: step.isRest,
      isCurrent: i === stepIndex,
    })
  }

  return rows
}
