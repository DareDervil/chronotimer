import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, FolderOpen, Globe, Lock, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteCollectionButton } from '@/components/collections/delete-collection-button'
import { CollectionShareDialog } from '@/components/collections/collection-share-dialog'

export const metadata = { title: 'Collections — Chronotimer' }

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: collections } = await supabase
    .from('collections')
    .select(`
      id, name, description, is_public, share_slug, updated_at,
      workouts:collection_workouts(workout:workout_id(is_public))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Collections</h1>
        <Link href="/collections/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          New collection
        </Link>
      </div>

      {!collections?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No collections yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Group workouts into collections to share programs with others
            </p>
            <Link href="/collections/new" className={buttonVariants()}>
              <Plus className="h-4 w-4 mr-2" />
              Create collection
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => {
            const memberWorkouts = col.workouts as unknown as { workout: { is_public: boolean } | null }[]
            const count = memberWorkouts?.length ?? 0
            const hasPrivateWorkouts = (memberWorkouts ?? []).some((w) => w.workout && !w.workout.is_public)
            return (
              <Card key={col.id} className="hover:border-foreground/20 transition-colors flex flex-col">
                <CardHeader className="pb-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">
                      <Link href={`/collections/${col.id}`} className="hover:underline">
                        {col.name}
                      </Link>
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {col.is_public ? (
                        <><Globe className="h-3 w-3 mr-1" />Public</>
                      ) : (
                        <><Lock className="h-3 w-3 mr-1" />Private</>
                      )}
                    </Badge>
                  </div>
                  {col.description && (
                    <CardDescription className="line-clamp-2">{col.description}</CardDescription>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {count} {count === 1 ? 'workout' : 'workouts'}
                  </p>
                </CardHeader>
                <CardFooter className="gap-2">
                  <Link
                    href={`/collections/${col.id}`}
                    className={buttonVariants({ size: 'sm', className: 'flex-1' })}
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/collections/${col.id}/edit`}
                    className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
                    title="Edit collection"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <CollectionShareDialog
                    collectionId={col.id}
                    initialIsPublic={col.is_public}
                    initialSlug={col.share_slug}
                    hasPrivateWorkouts={hasPrivateWorkouts}
                  />
                  <DeleteCollectionButton
                    collectionId={col.id}
                    collectionName={col.name}
                  />
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
