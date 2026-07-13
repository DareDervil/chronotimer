import { describe, expect, it } from 'vitest'
import { getNextExerciseLabel, getNextWorkStepLabel } from './next-step-label'
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

describe('getNextWorkStepLabel', () => {
  it('skips an immediately following rest to find the next work exercise', () => {
    const steps = [
      step({ exerciseName: 'Push-ups' }),
      step({ exerciseName: 'Rest', isRest: true, type: 'rest' }),
      step({ exerciseName: 'Squats' }),
    ]
    expect(getNextWorkStepLabel(steps, 0)).toBe('Squats')
  })

  it('finds the chronologically next work exercise even when a different exercise was inserted earlier in the workout (regression: was picking by first-ever occurrence, not proximity)', () => {
    // Circuit: A, rest, B, rest, C, rest | A, rest, B, rest, C, rest (round 2)
    const steps = [
      step({ exerciseName: 'A', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, type: 'rest' }),
      step({ exerciseName: 'B', blockId: 'b0', bexId: 'e1' }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, type: 'rest' }),
      step({ exerciseName: 'C', blockId: 'b0', bexId: 'e2' }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, type: 'rest' }),
      step({ exerciseName: 'A', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, type: 'rest' }),
      step({ exerciseName: 'B', blockId: 'b0', bexId: 'e1' }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, type: 'rest' }),
      step({ exerciseName: 'C', blockId: 'b0', bexId: 'e2' }),
    ]
    // Currently on the rest step right after A's first round — the next work step is B, not A.
    expect(getNextWorkStepLabel(steps, 1)).toBe('B')
  })

  it('returns null when no work step remains', () => {
    const steps = [
      step({ exerciseName: 'Push-ups' }),
      step({ exerciseName: 'Rest', isRest: true, type: 'rest' }),
    ]
    expect(getNextWorkStepLabel(steps, 0)).toBeNull()
  })
})
