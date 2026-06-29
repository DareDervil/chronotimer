import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { ActivityHeatmap } from '@/components/history/activity-heatmap'
import { SessionCard } from '@/components/history/session-card'
import { Clock, CheckCircle2, Dumbbell, Flame, Trophy } from 'lucide-react'

export const metadata = { title: 'History — Chronicon' }

function toKey(d: Date): string {
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD
}

function calcStreaks(sortedUniqueDays: string[]): { current: number; longest: number } {
  if (!sortedUniqueDays.length) return { current: 0, longest: 0 }

  // Longest streak
  let longest = 1, run = 1
  for (let i = 1; i < sortedUniqueDays.length; i++) {
    const diff =
      (new Date(sortedUniqueDays[i]).getTime() - new Date(sortedUniqueDays[i - 1]).getTime()) / 86_400_000
    if (diff === 1) { run++; if (run > longest) longest = run }
    else run = 1
  }

  // Current streak — counts if last workout was today or yesterday
  const today = toKey(new Date())
  const yesterday = toKey(new Date(Date.now() - 86_400_000))
  const last = sortedUniqueDays[sortedUniqueDays.length - 1]
  let current = 0
  if (last === today || last === yesterday) {
    current = 1
    for (let i = sortedUniqueDays.length - 2; i >= 0; i--) {
      const diff =
        (new Date(sortedUniqueDays[i + 1]).getTime() - new Date(sortedUniqueDays[i]).getTime()) / 86_400_000
      if (diff === 1) current++
      else break
    }
  }

  return { current, longest }
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Recent sessions for the session list
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('*, workout:workout_id(id, name)')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(50)

  // Past year of completed sessions for heatmap + streaks
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: yearSessions } = await supabase
    .from('workout_sessions')
    .select('started_at')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .gte('started_at', oneYearAgo.toISOString())
    .order('started_at', { ascending: true })

  // Build activity map and unique days for streaks
  const activityMap: Record<string, number> = {}
  const uniqueDays: string[] = []
  for (const s of yearSessions ?? []) {
    const key = toKey(new Date(s.started_at))
    if (!activityMap[key]) uniqueDays.push(key)
    activityMap[key] = (activityMap[key] ?? 0) + 1
  }

  const { current: currentStreak, longest: longestStreak } = calcStreaks(uniqueDays)

  const completed = sessions?.filter(s => s.completed_at) ?? []

  const totalMinutes = completed.reduce((sum, s) => {
    if (!s.completed_at) return sum
    return sum + Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000)
  }, 0)

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Total time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {totalMinutes >= 60
                ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                : `${totalMinutes}m`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Flame className="h-4 w-4" /> Current streak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currentStreak} <span className="text-base font-normal text-muted-foreground">days</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4" /> Longest streak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{longestStreak} <span className="text-base font-normal text-muted-foreground">days</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Activity</h2>
        <Card>
          <CardContent className="pt-4">
            <ActivityHeatmap data={activityMap} />
          </CardContent>
        </Card>
      </section>

      {/* Session list */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent sessions</h2>
        {!sessions?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Dumbbell className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">No sessions yet</p>
              <p className="text-sm text-muted-foreground">
                Complete a workout to see your history here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={{
                  id: session.id,
                  started_at: session.started_at,
                  completed_at: session.completed_at,
                  notes: session.notes,
                  workout_name: (session as { workout_name?: string | null }).workout_name ?? null,
                  workout: (session.workout as { name: string } | null),
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
