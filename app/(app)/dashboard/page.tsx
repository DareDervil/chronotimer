import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Play, Pencil, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Dashboard — Chronicon' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workouts }, { data: sessions }, { data: profile }] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, name, description, updated_at')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('workout_sessions')
      .select('id, started_at, completed_at')
      .eq('user_id', user!.id)
      .not('completed_at', 'is', null),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user!.id)
      .single(),
  ])

  const firstName = (profile?.display_name ?? user!.email?.split('@')[0] ?? 'Athlete').toUpperCase()
  const completedSessions = sessions ?? []
  const totalMinutes = completedSessions.reduce((sum, s) => {
    if (!s.completed_at) return sum
    return sum + Math.round(
      (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000
    )
  }, 0)

  const hour = new Date().getHours()
  const timeLabel = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pt-10 pb-8 border-b border-border/40 max-w-6xl mx-auto">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">
          Good {timeLabel}
        </p>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
          {firstName}
          <span className="text-primary">.</span>
        </h1>

        {/* Stats row */}
        <div className="grid grid-cols-3 mt-8">
          <div className="pr-4 md:pr-6 border-r border-border">
            <StatBlock value={workouts?.length ?? 0} label="Workouts" />
          </div>
          <div className="px-4 md:px-6 border-r border-border">
            <StatBlock value={completedSessions.length} label="Sessions" />
          </div>
          <div className="pl-4 md:pl-6">
            <StatBlock
              value={totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`}
              label="Total time"
            />
          </div>
        </div>
      </section>

      {/* ── Workouts ──────────────────────────────────────────── */}
      <section className="flex-1 px-6 md:px-10 py-8 max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Your Workouts
          </h2>
          <Link
            href="/workouts"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            All workouts <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {!workouts?.length ? (
          /* Empty state — editorial */
          <div className="border border-dashed border-border/60 rounded-2xl p-12 text-center">
            <p className="text-5xl font-black tracking-tighter text-muted-foreground/20 mb-4">
              NO WORKOUTS
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Build your first workout with drag &amp; drop
            </p>
            <Link href="/workouts/new" className={buttonVariants()}>
              Create workout
            </Link>
          </div>
        ) : (
          /* Horizontal editorial scroll */
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 md:-mx-10 px-6 md:px-10 snap-x snap-mandatory scrollbar-none">
            {workouts.map((workout, i) => (
              <WorkoutCard key={workout.id} workout={workout} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent activity strip ────────────────────────────── */}
      {completedSessions.length > 0 && (
        <section className="px-6 md:px-10 py-6 border-t border-border/40 max-w-6xl mx-auto">
          <Link
            href="/history"
            className="flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                Last session
              </p>
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                View full history
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </section>
      )}
    </div>
  )
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-3xl md:text-4xl font-black tracking-tight leading-none">{value}</p>
      <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase mt-1">
        {label}
      </p>
    </div>
  )
}

function WorkoutCard({
  workout,
  index,
}: {
  workout: { id: string; name: string; description: string | null }
  index: number
}) {
  const isFirst = index === 0

  return (
    <div
      className={cn(
        'group relative flex-none snap-start rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-primary/50',
        isFirst
          ? 'w-[80vw] sm:w-[280px] md:w-[340px] bg-primary text-primary-foreground'
          : 'w-[70vw] sm:w-[240px] md:w-[280px] bg-card backdrop-blur-md'
      )}
    >
      {/* Index number watermark */}
      <div
        className={cn(
          'absolute top-4 right-5 text-6xl font-black leading-none select-none pointer-events-none',
          isFirst ? 'text-primary-foreground/15' : 'text-foreground/5'
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="p-6 flex flex-col h-48">
        <div className="flex-1">
          <p
            className={cn(
              'text-[10px] font-bold tracking-[0.2em] uppercase mb-3',
              isFirst ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}
          >
            Workout
          </p>
          <h3 className="text-xl font-black tracking-tight leading-tight line-clamp-2">
            {workout.name}
          </h3>
          {workout.description && (
            <p
              className={cn(
                'text-xs mt-2 line-clamp-2 leading-relaxed',
                isFirst ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {workout.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Link
            href={`/workouts/${workout.id}/run`}
            className={cn(
              'flex items-center gap-2 flex-1 h-9 px-4 rounded-xl text-xs font-bold transition-all',
              isFirst
                ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Play className="h-3 w-3 fill-current" />
            Start
          </Link>
          <Link
            href={`/workouts/${workout.id}/edit`}
            className={cn(
              'flex items-center justify-center h-9 w-9 rounded-xl text-xs font-bold transition-all border',
              isFirst
                ? 'border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
