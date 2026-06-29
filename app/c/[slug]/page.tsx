import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CopyCollectionButton } from '@/components/collections/copy-collection-button'

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: col } = await supabase
    .from('collections')
    .select(`
      *,
      workouts:collection_workouts(
        *,
        workout:workout_id(id, name, description)
      )
    `)
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (!col) notFound()

  const items = ((col.workouts ?? []) as Array<{
    id: string
    workout_id: string
    order_index: number
    workout: { id: string; name: string; description: string | null } | null
  }>).sort((a, b) => a.order_index - b.order_index)

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Shared collection
          </p>
          <h1 className="text-3xl font-bold">{col.name}</h1>
          {col.description && (
            <p className="text-muted-foreground mt-2">{col.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {items.length} {items.length === 1 ? 'workout' : 'workouts'}
          </p>
          {items.map((item, idx) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.workout?.name ?? 'Workout'}
                    </p>
                    {item.workout?.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.workout.description}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/c/${slug}/workout/${idx}/run`}
                  className={buttonVariants({ size: 'sm' })}
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Run
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          {user ? (
            <CopyCollectionButton slug={slug} />
          ) : (
            <>
              <Link href="/register" className={buttonVariants({ variant: 'outline' })}>
                Copy to my account
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
