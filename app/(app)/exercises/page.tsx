import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExerciseLibrary } from '@/components/exercises/exercise-library'

export const metadata = { title: 'Exercise Library — Chronotimer' }

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`is_custom.eq.false,and(is_custom.eq.true,created_by.eq.${user.id})`)
    .order('category')
    .order('name')
    .limit(1000)

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <p className="text-muted-foreground">Browse and search all available exercises</p>
      </div>
      <ExerciseLibrary exercises={exercises ?? []} userId={user.id} />
    </div>
  )
}
