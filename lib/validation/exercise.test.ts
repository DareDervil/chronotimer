import { describe, expect, it } from 'vitest'
import { createExerciseSchema } from './exercise'

describe('createExerciseSchema', () => {
  const valid = {
    name: 'Squat',
    category: 'strength' as const,
    instructions: 'Bend knees',
    primary_muscles: ['quads'],
    secondary_muscles: [],
    equipment: [],
  }

  it('accepts a valid exercise', () => {
    expect(createExerciseSchema.safeParse(valid).success).toBe(true)
  })

  it('trims whitespace from the name', () => {
    const result = createExerciseSchema.safeParse({ ...valid, name: '  Squat  ' })
    expect(result.success && result.data.name).toBe('Squat')
  })

  it('rejects an empty name', () => {
    const result = createExerciseSchema.safeParse({ ...valid, name: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown category', () => {
    const result = createExerciseSchema.safeParse({ ...valid, category: 'yoga' })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 primary muscles', () => {
    const result = createExerciseSchema.safeParse({
      ...valid,
      primary_muscles: Array.from({ length: 21 }, (_, i) => `muscle${i}`),
    })
    expect(result.success).toBe(false)
  })
})
