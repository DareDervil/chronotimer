'use server'

import { requireUser } from '@/lib/actions/require-user'
import type { SaveWorkoutInput, BuilderPhase } from '@/types/builder'
import type { WorkoutWithStructure } from '@/types/database'

export async function createWorkout(input: SaveWorkoutInput): Promise<{ id: string }> {
  const { supabase } = await requireUser()

  const { data: workoutId, error } = await supabase.rpc('save_workout', {
    p_workout_id: null,
    p_name: input.name.trim(),
    p_description: input.description.trim() || null,
    p_phases: toStructurePayload(input.phases),
  })
  if (error || !workoutId) throw error ?? new Error('Failed to create workout')

  return { id: workoutId }
}

export async function updateWorkout(workoutId: string, input: SaveWorkoutInput): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase.rpc('save_workout', {
    p_workout_id: workoutId,
    p_name: input.name.trim(),
    p_description: input.description.trim() || null,
    p_phases: toStructurePayload(input.phases),
  })
  if (error) throw error
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function setWorkoutPublic(
  workoutId: string,
  isPublic: boolean,
): Promise<{ share_slug: string | null }> {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from('workouts')
    .update({ is_public: isPublic })
    .eq('id', workoutId)
    .eq('user_id', user.id)
    .select('share_slug')
    .single()

  if (error) throw error
  return { share_slug: data?.share_slug ?? null }
}

export async function cloneWorkout(slug: string): Promise<{ id: string }> {
  const { supabase } = await requireUser()

  const { data: workout, error } = await supabase
    .from('workouts')
    .select(`
      *,
      phases:workout_phases(
        *,
        blocks:workout_blocks(
          *,
          exercises:block_exercises(*, exercise:exercise_id(*))
        )
      )
    `)
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !workout) throw error ?? new Error('Workout not found')

  const source = workout as WorkoutWithStructure
  const phases: BuilderPhase[] = (source.phases ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((p) => ({
      id: p.id,
      phase_type: p.phase_type,
      blocks: (p.blocks ?? [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((b) => ({
          id: b.id,
          block_type: b.block_type,
          config: b.config,
          exercises: (b.exercises ?? [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((e) => ({
              id: e.id,
              exercise_id: e.exercise_id,
              exercise: e.exercise!,
              duration_s: e.duration_s,
              reps: e.reps,
              sets: e.sets,
              rest_after_s: e.rest_after_s,
            })),
        })),
    }))

  return createWorkout({
    name: `Copy of ${source.name}`,
    description: source.description ?? '',
    phases,
  })
}

// Shapes builder phases into the jsonb structure save_workout() expects.
// Phases with no blocks are dropped here (previously done in insertStructure).
function toStructurePayload(phases: BuilderPhase[]) {
  return phases
    .filter((p) => p.blocks.length > 0)
    .map((p) => ({
      phase_type: p.phase_type,
      blocks: p.blocks.map((b) => ({
        block_type: b.block_type,
        config: b.config,
        exercises: b.exercises.map((e) => ({
          exercise_id: e.exercise_id,
          duration_s: e.duration_s,
          reps: e.reps,
          sets: e.sets,
          rest_after_s: e.rest_after_s,
        })),
      })),
    }))
}
