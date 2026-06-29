import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyWorkoutButton } from '@/components/share/copy-workout-button'
import type { WorkoutWithStructure } from '@/types/database'

const PHASE_LABELS = { warmup: 'Warm-up', main: 'Main', cooldown: 'Cool-down' }
const BLOCK_LABELS = {
  hiit: 'HIIT', amrap: 'AMRAP', emom: 'EMOM', tabata: 'Tabata',
  circuit: 'Circuit', straight_sets: 'Straight Sets', free: 'Free-form',
}

export default async function SharedWorkoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

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

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Shared workout</p>
          <h1 className="text-3xl font-bold">{workout.name}</h1>
          {workout.description && (
            <p className="text-muted-foreground mt-2">{workout.description}</p>
          )}
        </div>

        {sorted.phases?.map((phase) => (
          <section key={phase.id}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {PHASE_LABELS[phase.phase_type]}
            </h2>
            <div className="space-y-3">
              {phase.blocks?.map((block) => (
                <Card key={block.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{BLOCK_LABELS[block.block_type]}</Badge>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {block.block_type === 'hiit' && block.config.work_s && (
                          `${block.config.work_s}s work / ${block.config.rest_s}s rest × ${block.config.rounds} rounds`
                        )}
                        {block.block_type === 'amrap' && block.config.total_duration_s && (
                          `${Math.floor(block.config.total_duration_s / 60)} min AMRAP`
                        )}
                        {block.block_type === 'emom' && block.config.total_duration_s && (
                          `${Math.floor(block.config.total_duration_s / 60)} min EMOM`
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {block.exercises?.map((be) => (
                        <li key={be.id} className="text-sm flex items-center justify-between">
                          <span>{be.exercise?.name ?? 'Unknown exercise'}</span>
                          <span className="text-muted-foreground text-xs">
                            {be.duration_s ? `${be.duration_s}s` : be.reps ? `${be.reps} reps` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-4 flex flex-wrap gap-3">
          <Link href={`/w/${slug}/run`} className={buttonVariants()}>
            Run workout
          </Link>
          {user ? (
            <CopyWorkoutButton slug={slug} />
          ) : (
            <>
              <Link href="/register" className={buttonVariants({ variant: 'outline' })}>
                Copy to my workouts
              </Link>
              <Link href="/login" className={buttonVariants({ variant: 'outline' })}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
