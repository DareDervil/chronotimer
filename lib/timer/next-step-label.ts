import type { TimerStep } from './flatten'

export function getNextExerciseLabel(steps: TimerStep[], stepIndex: number): string {
  const nextStep = steps[stepIndex + 1]
  return nextStep ? nextStep.exerciseName : 'Done'
}

export function getNextWorkStepLabel(steps: TimerStep[], stepIndex: number): string | null {
  for (let i = stepIndex + 1; i < steps.length; i++) {
    if (!steps[i].isRest) return steps[i].exerciseName
  }
  return null
}
