import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkoutBuilder } from '@/components/builder/workout-builder'
import type { WorkoutWithStructure } from '@/types/database'

export const metadata = { title: 'Edit Workout — Chronotimer' }

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workout }, { data: exercises }] = await Promise.all([
    supabase
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
      .eq('id', id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('exercises')
      .select('*')
      .order('category')
      .order('name')
      .limit(1000),
  ])

  if (!workout) notFound()

  const sorted = workout as WorkoutWithStructure
  sorted.phases?.sort((a, b) => a.order_index - b.order_index)
  sorted.phases?.forEach((p) => {
    p.blocks?.sort((a, b) => a.order_index - b.order_index)
    p.blocks?.forEach((b) => b.exercises?.sort((a, b) => a.order_index - b.order_index))
  })

  return <WorkoutBuilder exercises={exercises ?? []} initialWorkout={sorted} />
}
