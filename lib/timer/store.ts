import { create } from 'zustand'
import { flattenWorkout, type TimerStep } from './flatten'
import type { WorkoutWithStructure } from '@/types/database'

export type TimerStatus = 'idle' | 'countdown' | 'running' | 'paused' | 'done'

export interface TimerSnapshot {
  workoutId: string
  stepIndex: number
  timeLeft: number
  startedAt: number
  savedAt: number
}

const snapshotKey = (workoutId: string) => `chronicon:timer:${workoutId}`

function writeSnapshot(workoutId: string, stepIndex: number, timeLeft: number, startedAt: number) {
  try {
    localStorage.setItem(snapshotKey(workoutId), JSON.stringify({
      workoutId, stepIndex, timeLeft, startedAt, savedAt: Date.now(),
    } satisfies TimerSnapshot))
  } catch { /* storage full / private mode */ }
}

function removeSnapshot(workoutId: string) {
  try { localStorage.removeItem(snapshotKey(workoutId)) } catch { /* ignore */ }
}

interface WorkoutTimerStore {
  workoutId: string | null
  guestMode: boolean
  status: TimerStatus
  steps: TimerStep[]
  stepIndex: number
  countdown: number
  timeLeft: number
  startedAt: number | null
  stepEndsAt: number | null // wall-clock deadline (ms) for the current step; source of truth for timeLeft

  load: (workout: WorkoutWithStructure, guestMode?: boolean) => void
  startCountdown: () => void
  tick: () => void
  pause: () => void
  resume: () => void
  skip: () => void
  previous: () => void
  advance: (anchorMs?: number) => void
  reset: () => void
  restore: (stepIndex: number, timeLeft: number, startedAt: number) => void
  saveSnapshot: () => void
  clearSnapshot: () => void
}

export const useWorkoutTimerStore = create<WorkoutTimerStore>((set, get) => ({
  workoutId: null,
  guestMode: false,
  status: 'idle',
  steps: [],
  stepIndex: 0,
  countdown: 3,
  timeLeft: 0,
  startedAt: null,
  stepEndsAt: null,

  load(workout: WorkoutWithStructure, guestMode = false) {
    const steps = flattenWorkout(workout)
    set({
      workoutId: workout.id,
      guestMode,
      status: 'idle',
      steps,
      stepIndex: 0,
      countdown: 3,
      timeLeft: steps[0]?.duration ?? 0,
      startedAt: null,
      stepEndsAt: null,
    })
  },

  startCountdown() {
    set({ status: 'countdown', countdown: 3 })
  },

  tick() {
    const { status, countdown, stepIndex, steps } = get()

    if (status === 'countdown') {
      const next = countdown - 1
      if (next <= 0) {
        const firstStep = steps[stepIndex]
        const duration = firstStep?.duration ?? 0
        set({
          countdown: 0,
          status: 'running',
          timeLeft: duration,
          startedAt: Date.now(),
          stepEndsAt: Date.now() + duration * 1000,
        })
      } else {
        set({ countdown: next })
      }
      return
    }

    if (status === 'running') {
      const { stepEndsAt } = get()
      if (stepEndsAt === null) return

      const now = Date.now()
      let endsAt = stepEndsAt
      let guard = steps.length + 1

      // A tick may fire late (throttled/backgrounded tab), so the deadline
      // can already be behind by more than one step. Advance through every
      // step that has genuinely elapsed, carrying the real deadline forward
      // each time (anchored on the previous deadline, not `now`) so drift
      // never accumulates and no step is silently skipped.
      while (now >= endsAt && guard-- > 0) {
        get().advance(endsAt)
        if (get().status !== 'running') return
        endsAt = get().stepEndsAt as number
      }

      set({ timeLeft: Math.max(0, Math.ceil((endsAt - now) / 1000)) })
    }
  },

  pause() {
    const { status, guestMode, workoutId, stepIndex, timeLeft, startedAt } = get()
    if (status !== 'running') return
    set({ status: 'paused' })
    if (!guestMode && workoutId && startedAt !== null) {
      writeSnapshot(workoutId, stepIndex, timeLeft, startedAt)
    }
  },

  resume() {
    const { status, timeLeft } = get()
    if (status !== 'paused') return
    // Re-anchor the deadline to now — paused time must not count against it
    set({ status: 'running', stepEndsAt: Date.now() + timeLeft * 1000 })
  },

  skip() {
    get().advance()
  },

  previous() {
    const { stepIndex, steps } = get()
    const prevIndex = stepIndex - 1
    if (prevIndex < 0) return
    const prevStep = steps[prevIndex]
    set({ stepIndex: prevIndex, timeLeft: prevStep.duration, stepEndsAt: Date.now() + prevStep.duration * 1000 })
  },

  advance(anchorMs?: number) {
    const { stepIndex, steps, guestMode, workoutId, startedAt } = get()
    const nextIndex = stepIndex + 1

    if (nextIndex >= steps.length) {
      if (!guestMode && workoutId) removeSnapshot(workoutId)
      set({ status: 'done', stepEndsAt: null })
      return
    }

    const nextStep = steps[nextIndex]
    // When called from tick() due to a real deadline passing, anchorMs is the
    // previous step's ideal end time (not `now`) so any lag carries forward
    // instead of resetting. Manual skip()/user actions omit it, anchoring on now.
    const anchor = anchorMs ?? Date.now()
    const nextEndsAt = anchor + nextStep.duration * 1000
    set({ stepIndex: nextIndex, timeLeft: nextStep.duration, stepEndsAt: nextEndsAt })

    // Save at every step boundary so tab-close mid-step resumes at the right step
    if (!guestMode && workoutId && startedAt !== null) {
      writeSnapshot(workoutId, nextIndex, nextStep.duration, startedAt)
    }
  },

  reset() {
    const { steps, guestMode, workoutId } = get()
    if (!guestMode && workoutId) removeSnapshot(workoutId)
    set({
      status: 'idle',
      stepIndex: 0,
      countdown: 3,
      timeLeft: steps[0]?.duration ?? 0,
      startedAt: null,
      stepEndsAt: null,
    })
  },

  restore(stepIndex: number, timeLeft: number, startedAt: number) {
    set({ status: 'paused', stepIndex, timeLeft, startedAt, stepEndsAt: Date.now() + timeLeft * 1000 })
  },

  saveSnapshot() {
    const { guestMode, workoutId, stepIndex, timeLeft, startedAt } = get()
    if (!guestMode && workoutId && startedAt !== null) {
      writeSnapshot(workoutId, stepIndex, timeLeft, startedAt)
    }
  },

  clearSnapshot() {
    const { guestMode, workoutId } = get()
    if (!guestMode && workoutId) removeSnapshot(workoutId)
  },
}))

export function readSnapshot(workoutId: string): TimerSnapshot | null {
  try {
    const raw = localStorage.getItem(snapshotKey(workoutId))
    if (!raw) return null
    const snap = JSON.parse(raw) as TimerSnapshot
    const age = Date.now() - snap.savedAt
    if (age > 24 * 60 * 60 * 1000) {
      removeSnapshot(workoutId)
      return null
    }
    return snap
  } catch {
    return null
  }
}
