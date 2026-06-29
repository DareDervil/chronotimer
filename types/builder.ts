import type { BlockConfig, BlockType, Exercise, PhaseType } from './database'

export interface BuilderBlockExercise {
  id: string
  exercise_id: string
  exercise: Exercise
  duration_s: number | null
  reps: number | null
  sets: number | null
  rest_after_s: number
}

export interface BuilderBlock {
  id: string
  block_type: BlockType
  config: BlockConfig
  exercises: BuilderBlockExercise[]
}

export interface BuilderPhase {
  id: string
  phase_type: PhaseType
  blocks: BuilderBlock[]
}

export interface BuilderWorkout {
  name: string
  description: string
  phases: BuilderPhase[]
}

export type SaveWorkoutInput = {
  name: string
  description: string
  phases: BuilderPhase[]
}
