import { createClient } from '@/lib/supabase/server'
import { WorkoutBuilder } from '@/components/builder/workout-builder'

export const metadata = { title: 'Try Chronotimer — Build a Workout' }

export default async function TryPage() {
  const supabase = await createClient()

  // Only library exercises — custom ones require auth
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_custom', false)
    .order('category')
    .order('name')
    .limit(1000)

  return <WorkoutBuilder exercises={exercises ?? []} guestMode />
}
