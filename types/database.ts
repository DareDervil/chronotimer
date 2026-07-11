export type PhaseType = 'warmup' | 'main' | 'cooldown'
export type BlockType = 'hiit' | 'amrap' | 'emom' | 'tabata' | 'circuit' | 'straight_sets' | 'free' | 'rest'
export type ExerciseCategory = 'warmup' | 'cardio' | 'strength' | 'mobility'

// wger Latin muscle names stored in the DB
export type WgerMuscle =
  | 'Anterior deltoid'
  | 'Biceps brachii'
  | 'Biceps femoris'
  | 'Brachialis'
  | 'Gastrocnemius'
  | 'Gluteus maximus'
  | 'Latissimus dorsi'
  | 'Obliquus externus abdominis'
  | 'Pectoralis major'
  | 'Quadriceps femoris'
  | 'Rectus abdominis'
  | 'Serratus anterior'
  | 'Soleus'
  | 'Trapezius'
  | 'Triceps brachii'

export interface BlockConfig {
  // HIIT / Tabata
  work_s?: number
  rest_s?: number
  rounds?: number
  // AMRAP
  total_duration_s?: number
  // EMOM
  interval_s?: number
  // Circuit
  rest_between_exercises_s?: number
  rest_between_rounds_s?: number
  // Straight sets
  sets?: number
  rest_between_sets_s?: number
  // Free (warm-up / cool-down style)
  mode?: 'time' | 'reps'
  reps?: number
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  primary_muscles: string[]
  secondary_muscles: string[]
  equipment: string[]
  description: string | null
  instructions: string | null
  video_url: string | null
  is_custom: boolean
  created_by: string | null
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  share_slug: string | null
  created_at: string
  updated_at: string
}

export interface WorkoutPhase {
  id: string
  workout_id: string
  phase_type: PhaseType
  order_index: number
}

export interface WorkoutBlock {
  id: string
  phase_id: string
  block_type: BlockType
  config: BlockConfig
  order_index: number
}

export interface BlockExercise {
  id: string
  block_id: string
  exercise_id: string
  duration_s: number | null
  reps: number | null
  sets: number | null
  rest_after_s: number
  order_index: number
  // joined
  exercise?: Exercise
}

export interface WorkoutSession {
  id: string
  user_id: string
  workout_id: string
  started_at: string
  completed_at: string | null
  notes: string | null
  // joined
  workout?: Pick<Workout, 'id' | 'name'>
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  share_slug: string | null
  created_at: string
  updated_at: string
}

export interface CollectionWorkout {
  id: string
  collection_id: string
  workout_id: string
  order_index: number
  // joined
  workout?: Workout
}

export interface CollectionWithWorkouts extends Collection {
  workouts: CollectionWorkout[]
}

// Full nested workout for the builder / timer
export interface WorkoutWithStructure extends Workout {
  phases: (WorkoutPhase & {
    blocks: (WorkoutBlock & {
      exercises: BlockExercise[]
    })[]
  })[]
}
