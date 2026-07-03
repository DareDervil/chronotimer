import { z } from 'zod'

const phaseType = z.enum(['warmup', 'main', 'cooldown'])
const blockType = z.enum(['hiit', 'amrap', 'emom', 'tabata', 'circuit', 'straight_sets', 'free'])

// Mirrors types/database.ts's BlockConfig — every field is optional since
// lib/timer/flatten.ts already falls back to sane defaults for all of them.
// Validation here just rejects the wrong *type*/range if a field is present.
const blockConfigSchema = z.object({
  work_s: z.number().int().positive().optional(),
  rest_s: z.number().int().nonnegative().optional(),
  rounds: z.number().int().positive().optional(),
  total_duration_s: z.number().int().positive().optional(),
  interval_s: z.number().int().positive().optional(),
  rest_between_exercises_s: z.number().int().nonnegative().optional(),
  rest_between_rounds_s: z.number().int().nonnegative().optional(),
  sets: z.number().int().positive().optional(),
  rest_between_sets_s: z.number().int().nonnegative().optional(),
  mode: z.enum(['time', 'reps']).optional(),
  reps: z.number().int().positive().optional(),
})

const blockExerciseSchema = z.object({
  exercise_id: z.uuid('Invalid exercise'),
  duration_s: z.number().int().positive().nullable(),
  reps: z.number().int().positive().nullable(),
  sets: z.number().int().positive().nullable(),
  rest_after_s: z.number().int().nonnegative(),
})

const blockSchema = z.object({
  block_type: blockType,
  config: blockConfigSchema,
  exercises: z.array(blockExerciseSchema),
})

const phaseSchema = z.object({
  phase_type: phaseType,
  blocks: z.array(blockSchema),
})

export const saveWorkoutSchema = z.object({
  name: z.string().trim().min(1, 'Workout name is required').max(200, 'Workout name is too long'),
  description: z.string().trim().max(2000, 'Description is too long'),
  phases: z.array(phaseSchema),
})

export type ValidatedWorkoutPhases = z.infer<typeof saveWorkoutSchema>['phases']
