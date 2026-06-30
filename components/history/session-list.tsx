'use client'

import { useState } from 'react'
import { SessionCard } from './session-card'
import { getMoreSessions } from '@/lib/actions/sessions'
import { Button } from '@/components/ui/button'

interface Session {
  id: string
  started_at: string
  completed_at: string | null
  notes: string | null
  workout_name: string | null
  workout: { name: string } | null
}

interface SessionListProps {
  initialSessions: Session[]
  hasMore: boolean
}

export function SessionList({ initialSessions, hasMore: initialHasMore }: SessionListProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  async function loadMore() {
    setLoading(true)
    try {
      const more = await getMoreSessions(sessions.length)
      setSessions((prev) => [...prev, ...(more as Session[])])
      setHasMore(more.length === 50)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={{
            id: session.id,
            started_at: session.started_at,
            completed_at: session.completed_at,
            notes: session.notes,
            workout_name: session.workout_name,
            workout: session.workout,
          }}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
