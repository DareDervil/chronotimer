import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Play, Pencil, Globe, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteWorkoutButton } from '@/components/workouts/delete-workout-button'
import { ShareDialog } from '@/components/builder/share-dialog'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Workouts — Chronotimer' }

export default async function WorkoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, name, description, is_public, share_slug, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Workouts</h1>
        <Link href="/workouts/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          New workout
        </Link>
      </div>

      {!workouts?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-medium mb-1">No workouts yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Build your first workout with drag &amp; drop
            </p>
            <Link href="/workouts/new" className={buttonVariants()}>
              <Plus className="h-4 w-4 mr-2" />
              Create workout
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workouts.map((workout) => (
            <Card key={workout.id} className="hover:border-foreground/20 transition-colors flex flex-col">
              <CardHeader className="pb-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">{workout.name}</CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {workout.is_public ? (
                      <><Globe className="h-3 w-3 mr-1" />Public</>
                    ) : (
                      <><Lock className="h-3 w-3 mr-1" />Private</>
                    )}
                  </Badge>
                </div>
                {workout.description && (
                  <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
                )}
              </CardHeader>
              <CardFooter className="gap-2">
                <Link
                  href={`/workouts/${workout.id}/run`}
                  className={cn(buttonVariants({ size: 'sm' }), 'flex-1')}
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Start
                </Link>
                <Link
                  href={`/workouts/${workout.id}/edit`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Link>
                <ShareDialog
                  workoutId={workout.id}
                  initialIsPublic={workout.is_public}
                  initialSlug={workout.share_slug}
                  label="Share"
                />
                <DeleteWorkoutButton workoutId={workout.id} workoutName={workout.name} label="Delete" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
