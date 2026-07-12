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
