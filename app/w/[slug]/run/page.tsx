import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ActiveWorkout } from '@/components/timer/active-workout'
import type { WorkoutWithStructure } from '@/types/database'

export const metadata = { title: 'Run Workout — Chronicon' }

export default async function GuestRunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: workout } = await supabase
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

  if (!workout) notFound()

  const sorted = workout as WorkoutWithStructure
  sorted.phases?.sort((a, b) => a.order_index - b.order_index)
  sorted.phases?.forEach((p) => {
    p.blocks?.sort((a, b) => a.order_index - b.order_index)
    p.blocks?.forEach((b) => b.exercises?.sort((a, b) => a.order_index - b.order_index))
  })

  return <ActiveWorkout workout={sorted} guestMode />
}
