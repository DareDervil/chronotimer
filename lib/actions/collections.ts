'use server'

import { createClient } from '@/lib/supabase/server'
import type { Collection, CollectionWithWorkouts } from '@/types/database'

export async function getCollections(): Promise<CollectionWithWorkouts[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      workouts:collection_workouts(
        *,
        workout:workout_id(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(sortCollectionWorkouts)
}

export async function createCollection(
  name: string,
  description: string,
): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null })
    .select('id')
    .single()

  if (error || !data) throw error ?? new Error('Failed to create collection')
  return { id: data.id }
}

export async function updateCollection(
  collectionId: string,
  name: string,
  description: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('collections')
    .update({ name: name.trim(), description: description.trim() || null })
    .eq('id', collectionId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function setCollectionPublic(
  collectionId: string,
  isPublic: boolean,
): Promise<{ share_slug: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // When making public, read the existing slug first so we can
  // explicitly preserve it — prevents the DB from regenerating a new
  // slug on every re-share if a trigger is involved.
  let updatePayload: Record<string, unknown> = { is_public: isPublic }
  if (isPublic) {
    const { data: current } = await supabase
      .from('collections')
      .select('share_slug')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()
    if (current?.share_slug) {
      updatePayload = { is_public: true, share_slug: current.share_slug }
    }
  }

  const { data, error } = await supabase
    .from('collections')
    .update(updatePayload)
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .select('share_slug')
    .single()

  if (error) throw error
  return { share_slug: data?.share_slug ?? null }
}

export async function addWorkoutToCollection(
  collectionId: string,
  workoutId: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify the caller owns this collection
  const { data: col } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()
  if (!col) throw new Error('Collection not found')

  // Fetch the full workout structure to deep-copy
  // RLS ensures only owned or public workouts are accessible
  const { data: source, error: fetchErr } = await supabase
    .from('workouts')
    .select(`
      id, name, description,
      phases:workout_phases(
        id, phase_type, order_index,
        blocks:workout_blocks(
          id, block_type, config, order_index,
          exercises:block_exercises(
            id, exercise_id, duration_s, reps, sets, rest_after_s, order_index
          )
        )
      )
    `)
    .eq('id', workoutId)
    .single()

  if (fetchErr || !source) throw new Error('Workout not found')

  // Get next order_index
  const { data: last } = await supabase
    .from('collection_workouts')
    .select('order_index')
    .eq('collection_id', collectionId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextIndex = last ? last.order_index + 1 : 0

  // Deep-copy: new workout record owned by this user (private, no slug)
  const { data: newWorkout, error: wErr } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, name: source.name, description: source.description ?? null, is_public: false, share_slug: null })
    .select('id')
    .single()
  if (wErr || !newWorkout) throw wErr ?? new Error('Failed to copy workout')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phases = [...((source as any).phases ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
  for (const phase of phases) {
    const { data: newPhase, error: pErr } = await supabase
      .from('workout_phases')
      .insert({ workout_id: newWorkout.id, phase_type: phase.phase_type, order_index: phase.order_index })
      .select('id')
      .single()
    if (pErr || !newPhase) throw pErr ?? new Error('Failed to copy phase')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks = [...(phase.blocks ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
    for (const block of blocks) {
      const { data: newBlock, error: bErr } = await supabase
        .from('workout_blocks')
        .insert({ phase_id: newPhase.id, block_type: block.block_type, config: block.config, order_index: block.order_index })
        .select('id')
        .single()
      if (bErr || !newBlock) throw bErr ?? new Error('Failed to copy block')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exercises = [...(block.exercises ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
      if (exercises.length > 0) {
        const exRows = exercises.map((ex: any) => ({
          block_id: newBlock.id,
          exercise_id: ex.exercise_id,
          duration_s: ex.duration_s,
          reps: ex.reps,
          sets: ex.sets,
          rest_after_s: ex.rest_after_s,
          order_index: ex.order_index,
        }))
        const { error: exErr } = await supabase.from('block_exercises').insert(exRows)
        if (exErr) throw exErr
      }
    }
  }

  // Link the copy to the collection
  const { error: cwErr } = await supabase
    .from('collection_workouts')
    .insert({ collection_id: collectionId, workout_id: newWorkout.id, order_index: nextIndex })
  if (cwErr) throw cwErr
}

export async function removeWorkoutFromCollection(
  collectionId: string,
  workoutId: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify the caller owns this collection before deleting
  const { data: col } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()
  if (!col) throw new Error('Collection not found')

  const { error } = await supabase
    .from('collection_workouts')
    .delete()
    .eq('collection_id', collectionId)
    .eq('workout_id', workoutId)

  if (error) throw error
}

export async function cloneCollection(slug: string): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fetch full workout structure — phases → blocks → exercises
  const { data: source, error } = await supabase
    .from('collections')
    .select(`
      *,
      workouts:collection_workouts(
        order_index,
        workout_id,
        workout:workout_id(
          id, name, description,
          phases:workout_phases(
            id, phase_type, order_index,
            blocks:workout_blocks(
              id, block_type, config, order_index,
              exercises:block_exercises(
                id, exercise_id, duration_s, reps, sets, rest_after_s, order_index
              )
            )
          )
        )
      )
    `)
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !source) throw error ?? new Error('Collection not found')

  // Create the new collection
  const { data: newCol, error: cErr } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: `Copy of ${source.name}`,
      description: source.description ?? null,
    })
    .select('id')
    .single()

  if (cErr || !newCol) throw cErr ?? new Error('Failed to create collection')

  // Sort by order_index and deep-copy each workout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedCws = [...(source.workouts ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
  const newWorkoutIds: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const cw of sortedCws as any[]) {
    const w = cw.workout
    if (!w) continue // deleted workout — skip cleanly

    // 1. New workout record (private, no slug)
    const { data: newWorkout, error: wErr } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name: w.name, description: w.description ?? null, is_public: false, share_slug: null })
      .select('id')
      .single()
    if (wErr || !newWorkout) throw wErr ?? new Error('Failed to copy workout')

    // 2. Phases
    const phases = [...(w.phases ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
    for (const phase of phases) {
      const { data: newPhase, error: pErr } = await supabase
        .from('workout_phases')
        .insert({ workout_id: newWorkout.id, phase_type: phase.phase_type, order_index: phase.order_index })
        .select('id')
        .single()
      if (pErr || !newPhase) throw pErr ?? new Error('Failed to copy phase')

      // 3. Blocks
      const blocks = [...(phase.blocks ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
      for (const block of blocks) {
        const { data: newBlock, error: bErr } = await supabase
          .from('workout_blocks')
          .insert({ phase_id: newPhase.id, block_type: block.block_type, config: block.config, order_index: block.order_index })
          .select('id')
          .single()
        if (bErr || !newBlock) throw bErr ?? new Error('Failed to copy block')

        // 4. Exercises (batch insert)
        const exercises = [...(block.exercises ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
        if (exercises.length > 0) {
          const exRows = exercises.map((ex: any) => ({
            block_id: newBlock.id,
            exercise_id: ex.exercise_id,
            duration_s: ex.duration_s,
            reps: ex.reps,
            sets: ex.sets,
            rest_after_s: ex.rest_after_s,
            order_index: ex.order_index,
          }))
          const { error: exErr } = await supabase.from('block_exercises').insert(exRows)
          if (exErr) throw exErr
        }
      }
    }

    newWorkoutIds.push(newWorkout.id)
  }

  // Link the copied workouts to the new collection
  if (newWorkoutIds.length > 0) {
    const rows = newWorkoutIds.map((wid, i) => ({ collection_id: newCol.id, workout_id: wid, order_index: i }))
    const { error: cwErr } = await supabase.from('collection_workouts').insert(rows)
    if (cwErr) throw cwErr
  }

  return { id: newCol.id }
}

export async function getPublicCollection(slug: string): Promise<CollectionWithWorkouts | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      workouts:collection_workouts(
        *,
        workout:workout_id(*)
      )
    `)
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !data) return null
  return sortCollectionWorkouts(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortCollectionWorkouts(col: any): CollectionWithWorkouts {
  return {
    ...col,
    workouts: (col.workouts ?? []).sort(
      (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
    ),
  }
}
