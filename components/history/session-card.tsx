'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ChevronRight, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getSessionDetail, deleteSession } from '@/lib/actions/sessions'

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionDetail = Awaited<ReturnType<typeof getSessionDetail>>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(ms: number): string {
  const totalS = Math.round(ms / 1000)
  const h = Math.floor(totalS / 3600)
  const m = Math.floor((totalS % 3600) / 60)
  const s = totalS % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}

const PHASE_LABELS: Record<string, string> = {
  warmup: 'Warm-Up', main: 'Main', cooldown: 'Cool-Down',
}

const BLOCK_LABELS: Record<string, string> = {
  hiit: 'HIIT', tabata: 'Tabata', amrap: 'AMRAP',
  emom: 'EMOM', circuit: 'Circuit', straight_sets: 'Straight Sets', free: 'Free-form',
}

const BLOCK_BADGE: Record<string, string> = {
  hiit:          'bg-red-500/15 text-red-400 border-red-500/30',
  tabata:        'bg-orange-500/15 text-orange-400 border-orange-500/30',
  amrap:         'bg-blue-500/15 text-blue-400 border-blue-500/30',
  emom:          'bg-purple-500/15 text-purple-400 border-purple-500/30',
  circuit:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  straight_sets: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  free:          'bg-sky-500/15 text-sky-400 border-sky-500/30',
}

// ─── Session detail dialog ────────────────────────────────────────────────────

function SessionDetailDialog({ sessionId, open, onClose, onDeleted }: {
  sessionId: string
  open: boolean
  onClose: () => void
  onDeleted: () => void
}) {
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open || detail) return
    setLoading(true)
    getSessionDetail(sessionId)
      .then(setDetail)
      .finally(() => setLoading(false))
  }, [open, sessionId, detail])

  function handleOpenChange(o: boolean) {
    if (!o) onClose()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteSession(sessionId)
      onClose()
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  const workout = detail?.workout as {
    name: string
    phases: {
      id: string
      phase_type: string
      order_index: number
      blocks: {
        id: string
        block_type: string
        config: Record<string, unknown>
        order_index: number
        exercises: {
          id: string
          order_index: number
          duration_s: number | null
          reps: number | null
          sets: number | null
          exercise: { id: string; name: string } | null
        }[]
      }[]
    }[]
  } | null | undefined

  const durationMs = detail?.completed_at
    ? new Date(detail.completed_at).getTime() - new Date(detail.started_at).getTime()
    : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle>{detail?.workout_name ?? (workout?.name as string | undefined) ?? 'Session'}</DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive shrink-0"
              title="Delete session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>}

        {detail && (
          <div className="space-y-4">
            {/* Time summary */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Start</p>
                <p className="font-medium">{fmtTime(detail.started_at)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">End</p>
                <p className="font-medium">
                  {detail.completed_at ? fmtTime(detail.completed_at) : '—'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                <p className="font-medium">
                  {durationMs !== null ? fmtDuration(durationMs) : '—'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {detail.notes && (
              <p className="text-sm text-muted-foreground italic border-l-2 pl-3">{detail.notes}</p>
            )}

            {/* Workout structure */}
            {workout?.phases
              ?.slice()
              .sort((a, b) => a.order_index - b.order_index)
              .map((phase) => {
                const blocks = phase.blocks?.slice().sort((a, b) => a.order_index - b.order_index) ?? []
                if (blocks.length === 0) return null
                return (
                  <div key={phase.id}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {PHASE_LABELS[phase.phase_type] ?? phase.phase_type}
                    </p>
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <div key={block.id} className="rounded-lg border bg-card p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${BLOCK_BADGE[block.block_type] ?? 'bg-muted text-muted-foreground'}`}>
                              {BLOCK_LABELS[block.block_type] ?? block.block_type}
                            </span>
                          </div>
                          <div className="space-y-1 pl-1">
                            {block.exercises
                              ?.slice()
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((bex) => (
                                <div key={bex.id} className="flex items-center gap-2 text-sm">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                                  <span className="flex-1 text-sm">{bex.exercise?.name ?? 'Exercise'}</span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {bex.reps ? `${bex.reps} reps` : bex.duration_s ? `${bex.duration_s}s` : ''}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Session card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: {
    id: string
    started_at: string
    completed_at: string | null
    notes: string | null
    workout_name: string | null
    workout: { name: string } | null
  }
}

export function SessionCard({ session }: SessionCardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const durationMin = session.completed_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null

  return (
    <>
      <Card
        className="cursor-pointer hover:border-foreground/30 transition-colors"
        onClick={() => setOpen(true)}
      >
        <CardContent className="flex items-center justify-between py-3 px-4">
          <div className="min-w-0">
            <p className="font-medium text-sm">
              {session.workout_name ?? session.workout?.name ?? 'Unknown workout'}
              {session.completed_at && (
                <span className="text-muted-foreground font-normal"> — <span suppressHydrationWarning>{fmtDateTime(session.completed_at)}</span></span>
              )}
            </p>
            {!session.completed_at && (
              <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>{fmtDateTime(session.started_at)}</p>
            )}
            {session.notes && (
              <p className="text-xs text-muted-foreground mt-0.5 italic truncate max-w-xs">{session.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              {durationMin !== null ? (
                <>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {durationMin}m
                  </p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">incomplete</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <SessionDetailDialog
        sessionId={session.id}
        open={open}
        onClose={() => setOpen(false)}
        onDeleted={() => router.refresh()}
      />
    </>
  )
}
