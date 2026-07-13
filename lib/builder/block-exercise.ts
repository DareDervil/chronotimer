import type { Exercise } from '@/types/database'
import type { BuilderBlockExercise } from '@/types/builder'

export function createBlockExercise(exercise: Exercise, id: string): BuilderBlockExercise {
  return {
    id,
    exercise_id: exercise.id,
    exercise,
    duration_s: null,
    reps: null,
    sets: null,
    rest_after_s: 0,
  }
}
