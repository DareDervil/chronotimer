import { describe, expect, it } from 'vitest'
import { createBlockExercise } from './block-exercise'
import type { Exercise } from '@/types/database'

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Push-ups',
    category: 'strength',
    primary_muscles: [],
    secondary_muscles: [],
    equipment: [],
    description: null,
    instructions: null,
    video_url: null,
    is_custom: false,
    created_by: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('createBlockExercise', () => {
  it('uses the given id and links exercise_id/exercise to the source exercise', () => {
    const ex = exercise()
    const bex = createBlockExercise(ex, 'bex-1')
    expect(bex.id).toBe('bex-1')
    expect(bex.exercise_id).toBe('ex-1')
    expect(bex.exercise).toBe(ex)
  })

  it('defaults duration_s, reps, and sets to null, and rest_after_s to 0', () => {
    const bex = createBlockExercise(exercise(), 'bex-1')
    expect(bex.duration_s).toBeNull()
    expect(bex.reps).toBeNull()
    expect(bex.sets).toBeNull()
    expect(bex.rest_after_s).toBe(0)
  })
})
