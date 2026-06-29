import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ActiveWorkout } from '@/components/timer/active-workout'
import type { WorkoutWithStructure } from '@/types/database'

export const metadata = { title: 'Run Workout — Chronicon' }

export default async function CollectionWorkoutRunPage({
  params,
}: {
  params: Promise<{ slug: string; index: string }>
}) {
  const { slug, index } = await params
  const idx = parseInt(index, 10)
  if (isNaN(idx) || idx < 0) notFound()

  const supabase = await createClient()

  const { data: col } = await supabase
    .from('collections')
    .select(`
      workouts:collection_workouts(
        order_index,
        workout:workout_id(
          *,
          phases:workout_phases(
            *,
            blocks:workout_blocks(
              *,
              exercises:block_exercises(*, exercise:exercise_id(*))
            )
          )
        )
      )
    `)
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (!col) notFound()

  const sorted = ((col.workouts ?? []) as Array<{
    order_index: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workout: any
  }>).sort((a, b) => a.order_index - b.order_index)

  const entry = sorted[idx]
  if (!entry?.workout) notFound()

  const workout = entry.workout as WorkoutWithStructure
  workout.phases?.sort((a, b) => a.order_index - b.order_index)
  workout.phases?.forEach((p) => {
    p.blocks?.sort((a, b) => a.order_index - b.order_index)
    p.blocks?.forEach((b) => b.exercises?.sort((a, b) => a.order_index - b.order_index))
  })

  return <ActiveWorkout workout={workout} guestMode />
}
