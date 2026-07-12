'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkoutTimerStore, readSnapshot, type TimerSnapshot } from '@/lib/timer/store'
import { beep } from '@/lib/audio/beeps'
import { TimerRing } from './timer-ring'
import { WorkoutComplete } from './workout-complete'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { WorkoutWithStructure } from '@/types/database'

interface ActiveWorkoutProps {
  workout: WorkoutWithStructure
  userId?: string
  guestMode?: boolean
}

export function ActiveWorkout({ workout, userId, guestMode = false }: ActiveWorkoutProps) {
  const router = useRouter()

  const status      = useWorkoutTimerStore((s) => s.status)
  const steps       = useWorkoutTimerStore((s) => s.steps)
  const stepIndex   = useWorkoutTimerStore((s) => s.stepIndex)
  const countdown   = useWorkoutTimerStore((s) => s.countdown)
  const timeLeft    = useWorkoutTimerStore((s) => s.timeLeft)
  const startedAt   = useWorkoutTimerStore((s) => s.startedAt)

  const load          = useWorkoutTimerStore((s) => s.load)
  const startCountdown = useWorkoutTimerStore((s) => s.startCountdown)
  const tick          = useWorkoutTimerStore((s) => s.tick)
  const pause         = useWorkoutTimerStore((s) => s.pause)
  const resume        = useWorkoutTimerStore((s) => s.resume)
  const skip          = useWorkoutTimerStore((s) => s.skip)
  const previous      = useWorkoutTimerStore((s) => s.previous)
  const reset         = useWorkoutTimerStore((s) => s.reset)
  const restore       = useWorkoutTimerStore((s) => s.restore)
  const saveSnapshot  = useWorkoutTimerStore((s) => s.saveSnapshot)
  const clearSnapshot = useWorkoutTimerStore((s) => s.clearSnapshot)

  const [resumeSnap, setResumeSnap] = useState<TimerSnapshot | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // On mount: load steps, then check for a resumable snapshot (guests always start fresh)
  useEffect(() => {
    load(workout, guestMode)
    if (!guestMode) {
      const snap = readSnapshot(workout.id)
      const totalSteps = useWorkoutTimerStore.getState().steps.length
      if (snap && snap.stepIndex < totalSteps) {
        setResumeSnap(snap)
        return
      }
    }
    startCountdown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save snapshot on tab close / navigation while running (guests never save)
  useEffect(() => {
    if (guestMode || (status !== 'running' && status !== 'paused')) return
    const handleUnload = () => saveSnapshot()
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [guestMode, status, saveSnapshot])

  // Interval tick
  useEffect(() => {
    if (status !== 'running' && status !== 'countdown') return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status, tick])

  // Fire beeps on step change (skip initial mount)
  const prevStepIndex = useRef<number | null>(null)
  useEffect(() => {
    if (prevStepIndex.current === null) { prevStepIndex.current = stepIndex; return }
    if (prevStepIndex.current === stepIndex) return
    prevStepIndex.current = stepIndex
    const step = steps[stepIndex]
    if (!step) return
    if (step.isRest) beep.rest()
    else beep.go()
  }, [stepIndex, steps])

  // Countdown tick beeps
  const prevCountdown = useRef<number | null>(null)
  useEffect(() => {
    if (prevCountdown.current === null) { prevCountdown.current = countdown; return }
    if (prevCountdown.current === countdown) return
    prevCountdown.current = countdown
    if (countdown > 0) beep.tick()
  }, [countdown])

  // ARIA live announcements for screen readers
  const prevStepForAria = useRef<number | null>(null)
  useEffect(() => {
    if (prevStepForAria.current === null) { prevStepForAria.current = stepIndex; return }
    if (prevStepForAria.current === stepIndex) return
    prevStepForAria.current = stepIndex
    const step = steps[stepIndex]
    if (!step) return
    const msg = step.isRest ? `Rest. ${step.label}` : `${step.exerciseName}. ${step.label}`
    setAnnouncement(msg)
  }, [stepIndex, steps])

  useEffect(() => {
    if (countdown > 0) setAnnouncement(`Starting in ${countdown}`)
    else if (countdown === 0 && status === 'running') setAnnouncement('Go!')
  }, [countdown, status])

  // Keyboard shortcuts (desktop)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (status === 'running') pause()
          else if (status === 'paused') resume()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (status === 'running' || status === 'paused') skip()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if ((status === 'running' || status === 'paused') && stepIndex > 0) previous()
          break
        case 'Escape':
          if (!exitOpen) {
            if (status === 'running') pause()
            setExitOpen(true)
          }
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, stepIndex, exitOpen, pause, resume, skip, previous])

  // Screen wake lock — prevent display sleep while timer is running
  useEffect(() => {
    if (status !== 'running') return
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    navigator.wakeLock.request('screen').then((wl) => { lock = wl }).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [status])

  // Last-3-seconds tick beep + end chime (suppressed for rep-based steps)
  useEffect(() => {
    const step = steps[stepIndex]
    if (!step || status !== 'running' || step.isReps) return
    if (timeLeft === 1) beep.end()
    else if (timeLeft <= 3 && timeLeft > 1) beep.tick()
  }, [timeLeft, stepIndex, steps, status])

  function handleBack() {
    if (status === 'running') pause()
    setExitOpen(true)
  }

  function handleConfirmExit() {
    if (!guestMode) saveSnapshot()
    setExitOpen(false)
    router.back()
  }

  function handleReset() {
    reset()
    startCountdown()
  }

  function handleResume() {
    if (!resumeSnap) return
    restore(resumeSnap.stepIndex, resumeSnap.timeLeft, resumeSnap.startedAt)
    setResumeSnap(null)
  }

  function handleStartFresh() {
    clearSnapshot()
    setResumeSnap(null)
    startCountdown()
  }

  const currentStep = steps[stepIndex]
  const nextStep    = steps[stepIndex + 1]

  // ── Resume prompt ─────────────────────────────────────────────────────────

  if (resumeSnap) {
    const resumeStep = steps[resumeSnap.stepIndex]
    const elapsed = Math.round((resumeSnap.savedAt - resumeSnap.startedAt) / 1000)
    const elapsedFmt = elapsed >= 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Resume workout?</h1>
          <p className="text-muted-foreground">{workout.name}</p>
        </div>

        <div className="rounded-xl border bg-card px-6 py-5 space-y-3 text-sm w-full max-w-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">Step {resumeSnap.stepIndex + 1} of {steps.length}</span>
          </div>
          {resumeStep && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next up</span>
              <span className="font-medium truncate ml-4">{resumeStep.exerciseName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Elapsed so far</span>
            <span className="font-medium">{elapsedFmt}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleResume}
            className="w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={handleStartFresh}
            className="w-full rounded-lg border border-border px-6 py-3 font-semibold text-lg hover:bg-accent transition-colors"
          >
            Start fresh
          </button>
        </div>
      </div>
    )
  }

  // ── Completed ──────────────────────────────────────────────────────────────

  if (status === 'done') {
    return (
      <WorkoutComplete
        workoutName={workout.name}
        startedAt={startedAt ?? Date.now()}
        workoutId={workout.id}
        userId={userId}
        guestMode={guestMode}
        onReset={handleReset}
      />
    )
  }

  // ── Active timer ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      <span aria-live="assertive" aria-atomic="true" className="sr-only">{announcement}</span>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {workout.name}
        </button>
        <span className="text-sm font-medium text-muted-foreground">
          {currentStep?.phaseLabel ?? ''}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4 py-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {currentStep?.exerciseName ?? ''}
          </h2>
          <p className="text-muted-foreground">{currentStep?.label ?? ''}</p>
          {currentStep?.isRest && (
            <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">Rest</p>
          )}
        </div>

        <TimerRing
          duration={currentStep?.duration ?? 0}
          timeLeft={timeLeft}
          isRest={currentStep?.isRest ?? false}
          blockType={currentStep?.blockType ?? 'free'}
          isReps={currentStep?.isReps ?? false}
          repsDisplay={currentStep?.repsDisplay}
        />

        {nextStep && (
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground">
            Next:{' '}
            <span className="font-medium text-foreground">
              {nextStep.exerciseName}
              {nextStep.isRest ? ' (Rest)' : ''}
            </span>
          </p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="sticky bottom-0 z-10 flex items-center justify-around px-4 pt-4 bg-background/95 backdrop-blur border-t border-border" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={previous}
          disabled={stepIndex === 0}
          className="flex flex-col items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect x="4" y="4" width="2" height="12" rx="1" fill="currentColor" />
            <path d="M15 4l-8 6 8 6V4z" fill="currentColor" />
          </svg>
          Back
          <span className="hidden md:block text-[10px] text-muted-foreground/50 font-mono leading-none">←</span>
        </button>

        <button
          onClick={status === 'paused' ? resume : pause}
          disabled={status === 'countdown' || status === 'idle'}
          className="flex flex-col items-center gap-1 px-6 py-2 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {status === 'paused' ? (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
              </svg>
              Resume
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <rect x="5" y="4" width="4" height="12" rx="1" fill="currentColor" />
                <rect x="11" y="4" width="4" height="12" rx="1" fill="currentColor" />
              </svg>
              Pause
            </>
          )}
          <span className="hidden md:block text-[10px] text-primary-foreground/60 font-mono leading-none">Space</span>
        </button>

        <button
          onClick={skip}
          className="flex flex-col items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M5 4l8 6-8 6V4z" fill="currentColor" />
            <rect x="14" y="4" width="2" height="12" rx="1" fill="currentColor" />
          </svg>
          Next
          <span className="hidden md:block text-[10px] text-muted-foreground/50 font-mono leading-none">→</span>
        </button>

        <button
          onClick={handleBack}
          className="flex flex-col items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M16 16l-4-4m0 0l-4-4m4 4l4-4m-4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Exit
          <span className="hidden md:block text-[10px] text-muted-foreground/50 font-mono leading-none">Esc</span>
        </button>
      </div>

      {/* Exit confirmation dialog */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave this workout?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {guestMode
              ? 'Your progress won\'t be saved.'
              : 'Your progress is saved — you can resume from where you left off next time.'}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setExitOpen(false)}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Keep going
            </button>
            <button
              onClick={handleConfirmExit}
              className="flex-1 rounded-lg bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Leave
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Countdown overlay */}
      <AnimatePresence>
        {status === 'countdown' && countdown > 0 && (
          <motion.div
            key="countdown-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={countdown}
                className="text-9xl font-black tabular-nums"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {countdown}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}

        {status === 'running' && countdown === 0 && stepIndex === 0 && timeLeft === (steps[0]?.duration ?? 0) && (
          <motion.div
            key="go-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              className="text-9xl font-black text-primary"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              GO!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
