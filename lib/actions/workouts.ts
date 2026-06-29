'use server'

import { createClient } from '@/lib/supabase/server'
import type { SaveWorkoutInput, BuilderPhase } from '@/types/builder'
import type { WorkoutWithStructure } from '@/types/database'

export async function createWorkout(input: SaveWorkoutInput): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: workout, error: wErr } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, name: input.name.trim(), description: input.description.trim() || null })
    .select('id')
    .single()
  if (wErr || !workout) throw wErr ?? new Error('Failed to create workout')

  await insertStructure(supabase, workout.id, input.phases)
  return { id: workout.id }
}

export async function updateWorkout(workoutId: string, input: SaveWorkoutInput): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: wErr } = await supabase
    .from('workouts')
    .update({ name: input.name.trim(), description: input.description.trim() || null })
    .eq('id', workoutId)
    .eq('user_id', user.id)
  if (wErr) throw wErr

  // Delete existing phases (cascades to blocks → block_exercises)
  await supabase.from('workout_phases').delete().eq('workout_id', workoutId)

  await insertStructure(supabase, workoutId, input.phases)
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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

async function insertStructure(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  workoutId: string,
  phases: BuilderPhase[]
) {
  for (let pi = 0; pi < phases.length; pi++) {
    const phase = phases[pi]
    if (phase.blocks.length === 0) continue

    const { data: dbPhase, error: pErr } = await supabase
      .from('workout_phases')
      .insert({ workout_id: workoutId, phase_type: phase.phase_type, order_index: pi })
      .select('id')
      .single()
    if (pErr || !dbPhase) throw pErr ?? new Error('Failed to insert phase')

    for (let bi = 0; bi < phase.blocks.length; bi++) {
      const block = phase.blocks[bi]
      const { data: dbBlock, error: bErr } = await supabase
        .from('workout_blocks')
        .insert({ phase_id: dbPhase.id, block_type: block.block_type, config: block.config, order_index: bi })
        .select('id')
        .single()
      if (bErr || !dbBlock) throw bErr ?? new Error('Failed to insert block')

      if (block.exercises.length === 0) continue

      const rows = block.exercises.map((ex, ei) => ({
        block_id: dbBlock.id,
        exercise_id: ex.exercise_id,
        duration_s: ex.duration_s,
        reps: ex.reps,
        sets: ex.sets,
        rest_after_s: ex.rest_after_s,
        order_index: ei,
      }))
      const { error: eErr } = await supabase.from('block_exercises').insert(rows)
      if (eErr) throw eErr
    }
  }
}
