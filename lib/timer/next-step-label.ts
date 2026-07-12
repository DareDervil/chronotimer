import type { TimerStep } from './flatten'

export function getNextExerciseLabel(steps: TimerStep[], stepIndex: number): string {
  const nextStep = steps[stepIndex + 1]
  return nextStep ? nextStep.exerciseName : 'Done'
}
