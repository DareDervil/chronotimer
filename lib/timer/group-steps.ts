import { BLOCK_META } from '@/lib/block-colors'
import type { TimerStep } from './flatten'

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
        key: `divider-${step.blockId}`,
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
