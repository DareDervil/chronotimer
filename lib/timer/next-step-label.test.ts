import { describe, expect, it } from 'vitest'
import { getNextExerciseLabel } from './next-step-label'
import type { TimerStep } from './flatten'

let _n = 0
function step(overrides: Partial<TimerStep>): TimerStep {
  _n++
  return {
    id: `s${_n}`,
    type: 'work',
    exerciseName: 'Exercise',
    label: '',
    duration: 20,
    isRest: false,
    isReps: false,
    repsDisplay: null,
    phaseLabel: 'Main',
    blockType: 'hiit',
    blockId: 'b0',
    bexId: 'e0',
    ...overrides,
  }
}

describe('getNextExerciseLabel', () => {
  it('returns the exerciseName of the literal next step', () => {
    const steps = [
      step({ exerciseName: 'Push-ups' }),
      step({ exerciseName: 'Squats' }),
    ]
    expect(getNextExerciseLabel(steps, 0)).toBe('Squats')
  })

  it('returns the same exercise name again when the next step is a rest before another set of it', () => {
    const steps = [
      step({ exerciseName: 'Push-ups' }),
      step({ exerciseName: 'Rest', isRest: true, type: 'rest' }),
      step({ exerciseName: 'Push-ups' }),
    ]
    expect(getNextExerciseLabel(steps, 1)).toBe('Push-ups')
  })

  it('returns "Done" on the last step of the workout', () => {
    const steps = [
      step({ exerciseName: 'Push-ups' }),
      step({ exerciseName: 'Squats' }),
    ]
    expect(getNextExerciseLabel(steps, 1)).toBe('Done')
  })
})
