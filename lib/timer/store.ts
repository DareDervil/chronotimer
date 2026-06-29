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

  load: (workout: WorkoutWithStructure, guestMode?: boolean) => void
  startCountdown: () => void
  tick: () => void
  pause: () => void
  resume: () => void
  skip: () => void
  previous: () => void
  advance: () => void
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
    })
  },

  startCountdown() {
    set({ status: 'countdown', countdown: 3 })
  },

  tick() {
    const { status, countdown, stepIndex, steps, timeLeft } = get()

    if (status === 'countdown') {
      const next = countdown - 1
      if (next <= 0) {
        const firstStep = steps[stepIndex]
        set({
          countdown: 0,
          status: 'running',
          timeLeft: firstStep?.duration ?? 0,
          startedAt: Date.now(),
        })
      } else {
        set({ countdown: next })
      }
      return
    }

    if (status === 'running') {
      const step = steps[stepIndex]
      if (!step) return

      const next = timeLeft - 1
      if (next <= 0) {
        get().advance()
      } else {
        set({ timeLeft: next })
      }
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
    const { status } = get()
    if (status === 'paused') set({ status: 'running' })
  },

  skip() {
    get().advance()
  },

  previous() {
    const { stepIndex, steps } = get()
    const prevIndex = stepIndex - 1
    if (prevIndex < 0) return
    const prevStep = steps[prevIndex]
    set({ stepIndex: prevIndex, timeLeft: prevStep.duration })
  },

  advance() {
    const { stepIndex, steps, guestMode, workoutId, startedAt } = get()
    const nextIndex = stepIndex + 1

    if (nextIndex >= steps.length) {
      if (!guestMode && workoutId) removeSnapshot(workoutId)
      set({ status: 'done' })
      return
    }

    const nextStep = steps[nextIndex]
    set({ stepIndex: nextIndex, timeLeft: nextStep.duration })

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
    })
  },

  restore(stepIndex: number, timeLeft: number, startedAt: number) {
    set({ status: 'paused', stepIndex, timeLeft, startedAt })
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
