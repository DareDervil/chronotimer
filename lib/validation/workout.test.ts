import { describe, expect, it } from 'vitest'
import { saveWorkoutSchema } from './workout'

function baseWorkout(overrides: Partial<Parameters<typeof saveWorkoutSchema.parse>[0]> = {}) {
  return {
    name: 'Leg Day',
    description: '',
    phases: [
      {
        phase_type: 'main' as const,
        blocks: [
          {
            block_type: 'hiit' as const,
            config: { work_s: 20, rest_s: 10, rounds: 3 },
            exercises: [
              {
                exercise_id: '11111111-1111-4111-8111-111111111111',
                duration_s: null,
                reps: null,
                sets: null,
                rest_after_s: 0,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('saveWorkoutSchema', () => {
  it('accepts a well-formed workout', () => {
    expect(saveWorkoutSchema.safeParse(baseWorkout()).success).toBe(true)
  })

  it('rejects a negative rest_s in block config', () => {
    const w = baseWorkout()
    w.phases[0].blocks[0].config.rest_s = -5
    expect(saveWorkoutSchema.safeParse(w).success).toBe(false)
  })

  it('rejects an invalid exercise_id (not a uuid)', () => {
    const w = baseWorkout()
    w.phases[0].blocks[0].exercises[0].exercise_id = 'not-a-uuid'
    expect(saveWorkoutSchema.safeParse(w).success).toBe(false)
  })

  it('rejects an empty workout name', () => {
    expect(saveWorkoutSchema.safeParse(baseWorkout({ name: '  ' })).success).toBe(false)
  })

  it('allows rest_s of exactly 0 (nonnegative, not just positive)', () => {
    const w = baseWorkout()
    w.phases[0].blocks[0].config.rest_s = 0
    expect(saveWorkoutSchema.safeParse(w).success).toBe(true)
  })
})
