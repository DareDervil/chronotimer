'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSessionDetail(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      id, started_at, completed_at, notes, workout_name,
      workout:workout_id(
        id, name,
        phases:workout_phases(
          id, phase_type, order_index,
          blocks:workout_blocks(
            id, block_type, config, order_index,
            exercises:block_exercises(
              id, order_index, duration_s, reps, sets, rest_after_s,
              exercise:exercise_id(id, name)
            )
          )
        )
      )
    `)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function saveSession(
  workoutId: string,
  workoutName: string,
  startedAt: string,
  completedAt: string,
  notes?: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('workout_sessions').insert({
    user_id: user.id,
    workout_id: workoutId,
    workout_name: workoutName,
    started_at: startedAt,
    completed_at: completedAt,
    notes: notes?.trim() || null,
  })

  if (error) throw error
}
