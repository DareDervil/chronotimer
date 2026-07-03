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

  const { error } = await supabase.rpc('add_workout_to_collection', {
    p_collection_id: collectionId,
    p_workout_id: workoutId,
  })
  if (error) throw error
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

  const { data: newCollectionId, error } = await supabase.rpc('clone_collection', {
    p_slug: slug,
  })
  if (error || !newCollectionId) throw error ?? new Error('Failed to clone collection')

  return { id: newCollectionId }
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
