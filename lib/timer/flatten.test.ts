import { describe, expect, it } from 'vitest'
import { flattenWorkout } from './flatten'
import type { BlockConfig, BlockType, PhaseType, WorkoutWithStructure } from '@/types/database'

function workout(
  blocks: { block_type: BlockType; config: BlockConfig; exerciseNames: string[] }[],
  phaseType: PhaseType = 'main',
): WorkoutWithStructure {
  return {
    id: 'w1',
    user_id: 'u1',
    name: 'Test Workout',
    description: null,
    is_public: false,
    share_slug: null,
    created_at: '',
    updated_at: '',
    phases: [
      {
        id: 'p1',
        workout_id: 'w1',
        phase_type: phaseType,
        order_index: 0,
        blocks: blocks.map((b, bi) => ({
          id: `b${bi}`,
          phase_id: 'p1',
          block_type: b.block_type,
          config: b.config,
          order_index: bi,
          exercises: b.exerciseNames.map((name, ei) => ({
            id: `e${bi}-${ei}`,
            block_id: `b${bi}`,
            exercise_id: `ex${bi}-${ei}`,
            duration_s: null,
            reps: null,
            sets: null,
            rest_after_s: 0,
            order_index: ei,
            exercise: {
              id: `ex${bi}-${ei}`,
              name,
              category: 'strength',
              primary_muscles: [],
              secondary_muscles: [],
              equipment: [],
              description: null,
              instructions: null,
              video_url: null,
              is_custom: false,
              created_by: null,
              created_at: '',
            },
          })),
        })),
      },
    ],
  }
}

describe('flattenWorkout — hiit/tabata', () => {
  it('alternates work/rest per exercise per round, skipping rest after the very last step', () => {
    const w = workout([
      { block_type: 'hiit', config: { rounds: 2, work_s: 20, rest_s: 10 }, exerciseNames: ['Squat', 'Push-up'] },
    ])
    const steps = flattenWorkout(w)

    expect(steps.map((s) => [s.type, s.exerciseName, s.duration])).toEqual([
      ['work', 'Squat', 20],
      ['rest', 'Rest', 10],
      ['work', 'Push-up', 20],
      ['rest', 'Rest', 10],
      ['work', 'Squat', 20],
      ['rest', 'Rest', 10],
      ['work', 'Push-up', 20], // last exercise of last round: no trailing rest
    ])
  })

  it('omits rest steps entirely when rest_s is 0', () => {
    const w = workout([
      { block_type: 'tabata', config: { rounds: 1, work_s: 20, rest_s: 0 }, exerciseNames: ['Burpee', 'Jump'] },
    ])
    const steps = flattenWorkout(w)

    expect(steps.every((s) => s.type === 'work')).toBe(true)
    expect(steps).toHaveLength(2)
  })
})

describe('flattenWorkout — circuit', () => {
  it('inserts rest between exercises and between rounds only when configured', () => {
    const w = workout([
      {
        block_type: 'circuit',
        config: { rounds: 2, rest_between_exercises_s: 15, rest_between_rounds_s: 30 },
        exerciseNames: ['Lunge', 'Plank'],
      },
    ])
    const steps = flattenWorkout(w)

    expect(steps.map((s) => [s.type, s.duration])).toEqual([
      ['work', 30], // no duration_s/work_s configured: falls back to DEFAULT_WORK_S
      ['rest', 15],
      ['work', 30],
      ['rest', 30], // between rounds
      ['work', 30],
      ['rest', 15],
      ['work', 30], // last step of last round: no trailing rest
    ])
  })
})

describe('flattenWorkout — straight_sets', () => {
  it('shows reps display and rests between sets but not after the last set of the last exercise', () => {
    const w = workout([
      { block_type: 'straight_sets', config: { sets: 2, rest_between_sets_s: 45 }, exerciseNames: ['Deadlift'] },
    ])
    const steps = flattenWorkout(w)

    expect(steps.map((s) => [s.type, s.duration])).toEqual([
      ['work', 300],
      ['rest', 45],
      ['work', 300],
    ])
  })
})

describe('flattenWorkout — rest block', () => {
  it('falls back to 60s when rest_s is 0 or unset', () => {
    const w = workout([{ block_type: 'rest', config: { rest_s: 0 }, exerciseNames: [] }])
    const steps = flattenWorkout(w)

    expect(steps).toEqual([expect.objectContaining({ type: 'rest', duration: 60 })])
  })

  it('uses the configured rest_s when positive', () => {
    const w = workout([{ block_type: 'rest', config: { rest_s: 90 }, exerciseNames: [] }])
    const steps = flattenWorkout(w)

    expect(steps[0].duration).toBe(90)
  })
})

describe('flattenWorkout — blockType on every step', () => {
  it('tags each step with the block_type it came from, for both work and rest steps', () => {
    const w = workout([
      { block_type: 'hiit', config: { rounds: 1, work_s: 20, rest_s: 10 }, exerciseNames: ['Squat', 'Push-up'] },
      { block_type: 'amrap', config: { total_duration_s: 300 }, exerciseNames: ['Burpee'] },
    ])
    const steps = flattenWorkout(w)

    expect(steps.map((s) => s.blockType)).toEqual([
      'hiit', 'hiit', 'hiit', // work, rest, work (last step of block has no trailing rest)
      'amrap',
    ])
  })
})
