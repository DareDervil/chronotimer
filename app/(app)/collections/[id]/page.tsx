import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Play, Globe, Lock, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteCollectionButton } from '@/components/collections/delete-collection-button'
import { CollectionShareDialog } from '@/components/collections/collection-share-dialog'
import { RemoveWorkoutButton } from '@/components/collections/remove-workout-button'
import { AddWorkoutsForm } from '@/components/collections/add-workouts-form'

export const metadata = { title: 'Collection — Chronotimer' }

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: col } = await supabase
    .from('collections')
    .select(`
      *,
      workouts:collection_workouts(
        *,
        workout:workout_id(id, name, description, is_public)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!col) notFound()

  const items = ((col.workouts ?? []) as Array<{
    id: string
    workout_id: string
    order_index: number
    workout: { id: string; name: string; description: string | null; is_public: boolean } | null
  }>).sort((a, b) => a.order_index - b.order_index)

  const { data: allWorkouts } = await supabase
    .from('workouts')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')

  const inCollectionIds = new Set(items.map((i) => i.workout_id))
  const addableWorkouts = (allWorkouts ?? []).filter((w) => !inCollectionIds.has(w.id))

  return (
    <div className="px-6 md:px-10 py-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{col.name}</h1>
              <Badge variant="outline" className="text-xs shrink-0">
                {col.is_public ? (
                  <><Globe className="h-3 w-3 mr-1" />Public</>
                ) : (
                  <><Lock className="h-3 w-3 mr-1" />Private</>
                )}
              </Badge>
            </div>
            {col.description && (
              <p className="text-muted-foreground text-sm">{col.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/collections/${id}/edit`}
              className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
              title="Edit collection"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <CollectionShareDialog
              collectionId={id}
              initialIsPublic={col.is_public}
              initialSlug={col.share_slug}
            />
            <DeleteCollectionButton collectionId={id} collectionName={col.name} />
          </div>
        </div>
      </div>

      {/* Workout list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Workouts ({items.length})
        </h2>
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No workouts yet. Add some below.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.workout?.name ?? 'Deleted workout'}
                    </p>
                    {item.workout?.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.workout.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.workout && (
                    <Link
                      href={`/workouts/${item.workout.id}/run`}
                      className={buttonVariants({ size: 'icon-sm', variant: 'ghost' })}
                      title="Run workout"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <RemoveWorkoutButton collectionId={id} workoutId={item.workout_id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add workouts */}
      {addableWorkouts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Add workouts
          </h2>
          <AddWorkoutsForm collectionId={id} workouts={addableWorkouts} />
        </div>
      )}
    </div>
  )
}
