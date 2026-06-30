import { createClient } from '@/lib/supabase/server'
import { WorkoutBuilder } from '@/components/builder/workout-builder'

export const metadata = { title: 'New Workout — Chronotimer' }

export default async function NewWorkoutPage() {
  const supabase = await createClient()

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('category')
    .order('name')
    .limit(1000)

  return <WorkoutBuilder exercises={exercises ?? []} />
}
