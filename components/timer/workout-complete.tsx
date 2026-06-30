'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { beep } from '@/lib/audio/beeps'
import { saveSession } from '@/lib/actions/sessions'

interface WorkoutCompleteProps {
  workoutName: string
  startedAt: number       // Date.now() value
  workoutId: string
  userId?: string
  guestMode?: boolean
  onReset: () => void
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function WorkoutComplete({
  workoutName,
  startedAt,
  workoutId,
  guestMode = false,
  onReset,
}: WorkoutCompleteProps) {
  const router = useRouter()
  const elapsed = Date.now() - startedAt
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    beep.done()
  }, [])

  async function handleSave() {
    setSaving(true)
    await saveSession(
      workoutId,
      workoutName,
      new Date(startedAt).toISOString(),
      new Date().toISOString(),
      notes,
    )
    router.push('/history')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Workout Complete!</h1>
        <p className="text-xl text-muted-foreground">{workoutName}</p>
        <p className="text-2xl font-semibold">{formatElapsed(elapsed)}</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {guestMode ? (
          <>
            <p className="text-sm text-muted-foreground">
              Create a free account to save your sessions and track your progress over time.
            </p>
            <Link
              href="/register"
              className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors text-center"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-border px-6 py-3 font-semibold text-lg hover:bg-accent transition-colors text-center"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              placeholder="Add a note… (optional)"
              rows={3}
              enterKeyHint="done"
              style={{ fontSize: '16px' }}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save & Finish'}
            </button>
          </>
        )}
        <button
          onClick={onReset}
          className="w-full rounded-lg border border-border px-6 py-3 font-semibold text-lg hover:bg-accent transition-colors"
        >
          Do it again
        </button>
      </div>
    </div>
  )
}
