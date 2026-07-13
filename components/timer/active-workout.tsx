'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Drawer } from '@/components/ui/drawer'
import { ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkoutTimerStore, readSnapshot, type TimerSnapshot } from '@/lib/timer/store'
import { getNextExerciseLabel, getNextWorkStepLabel } from '@/lib/timer/next-step-label'
import { beep } from '@/lib/audio/beeps'
import { TimerRing } from './timer-ring'
import { FullProgramList } from './full-program-list'
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
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  // Fallback only exercised if startedAt is somehow unset when the workout completes.
  // Captured once via the lazy initializer so render stays pure (a stable value per mount,
  // not a fresh Date.now() read — and therefore a correct one — on every re-render).
  const [fallbackStartedAt] = useState(() => Date.now())

  // On mount: load steps, then check for a resumable snapshot (guests always start fresh).
  // This must stay an effect: readSnapshot touches localStorage, which doesn't exist during
  // SSR — resolving it in a useState initializer instead would make the client's first render
  // diverge from the server-rendered HTML (a hydration mismatch) whenever a snapshot exists.
  useEffect(() => {
    load(workout, guestMode)
    if (!guestMode) {
      const snap = readSnapshot(workout.id)
      const totalSteps = useWorkoutTimerStore.getState().steps.length
      if (snap && snap.stepIndex < totalSteps) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
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

  // Fire bell on step change, and when the first exercise kicks off after the countdown
  const prevStepIndex = useRef<number | null>(null)
  const prevStatusForBell = useRef<string | null>(null)
  useEffect(() => {
    const startedFirstExercise = status === 'running' && prevStatusForBell.current === 'countdown'
    prevStatusForBell.current = status

    const stepChanged = prevStepIndex.current !== null && prevStepIndex.current !== stepIndex
    prevStepIndex.current = stepIndex

    if (!startedFirstExercise && !stepChanged) return
    const step = steps[stepIndex]
    if (!step) return
    beep.exerciseStart()
  }, [stepIndex, steps, status])

  // Countdown: voice "Three", "Two", "One"
  const prevCountdown = useRef<number | null>(null)
  const prevStatus = useRef<string | null>(null)
  useEffect(() => {
    if (status === 'countdown' && prevStatus.current !== 'countdown') {
      beep.count(3)
    }
    prevStatus.current = status
    if (prevCountdown.current === null) { prevCountdown.current = countdown; return }
    if (prevCountdown.current === countdown) return
    prevCountdown.current = countdown
    if (countdown === 2 || countdown === 1) beep.count(countdown)
  }, [countdown, status])

  // ARIA live announcements for screen readers.
  // Derived during render (not in an effect) per React's "adjusting state when a prop
  // changes" pattern — the announcement is purely a function of stepIndex/steps/countdown/
  // status, so computing it here avoids an extra commit-then-rerender pass.
  const [prevAriaStepIndex, setPrevAriaStepIndex] = useState<number | null>(null)
  if (prevAriaStepIndex !== stepIndex) {
    setPrevAriaStepIndex(stepIndex)
    if (prevAriaStepIndex !== null) {
      const step = steps[stepIndex]
      if (step) {
        setAnnouncement(step.isRest ? `Rest. ${step.label}` : `${step.exerciseName}. ${step.label}`)
      }
    }
  }

  const [countdownAria, setCountdownAria] = useState<{ countdown: number | null; status: string | null; goFired: boolean }>(
    { countdown: null, status: null, goFired: false }
  )
  if (countdownAria.countdown !== countdown || countdownAria.status !== status) {
    if (countdown > 0) {
      setCountdownAria({ countdown, status, goFired: false })
      setAnnouncement(`Starting in ${countdown}`)
    } else if (countdown === 0 && status === 'running' && !countdownAria.goFired) {
      setCountdownAria({ countdown, status, goFired: true })
      setAnnouncement('Go!')
    } else {
      setCountdownAria({ countdown, status, goFired: countdownAria.goFired })
    }
  }

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

  // Halfway callout (suppressed for rep-based and very short steps)
  useEffect(() => {
    const step = steps[stepIndex]
    if (!step || status !== 'running' || step.isReps) return
    if (step.duration < 10) return
    if (timeLeft === Math.floor(step.duration / 2)) {
      beep.halfway()
    }
  }, [timeLeft, stepIndex, steps, status])

  // Final-3-seconds tick (work or rest; suppressed for rep-based steps)
  useEffect(() => {
    const step = steps[stepIndex]
    if (!step || status !== 'running' || step.isReps) return
    if (timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
      beep.tick()
    }
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
  const nextWorkLabel = currentStep ? getNextWorkStepLabel(steps, stepIndex) : null
  const nextExerciseLabel = currentStep ? getNextExerciseLabel(steps, stepIndex) : null

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
        startedAt={startedAt ?? fallbackStartedAt}
        workoutId={workout.id}
        userId={userId}
        guestMode={guestMode}
        onReset={handleReset}
      />
    )
  }

  // ── Active timer ───────────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col', guestMode ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-screen')}>
      <span aria-live="assertive" aria-atomic="true" className="sr-only">{announcement}</span>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border shrink-0">
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
      <div className="flex flex-1 min-h-0 items-stretch">
        <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4 py-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {currentStep?.exerciseName ?? ''}
              {nextExerciseLabel && (
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-muted-foreground">
                  {' '}→ {nextExerciseLabel}
                </span>
              )}
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

          {nextWorkLabel && (
            <button
              onClick={() => setUpcomingOpen(true)}
              className="md:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Up next:{' '}
              <span className="font-medium text-foreground">{nextWorkLabel}</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <aside className="hidden md:block w-[360px] lg:w-[440px] shrink-0 border-l border-border overflow-y-auto px-4 py-5">
          <FullProgramList steps={steps} stepIndex={stepIndex} />
        </aside>
      </div>

      {/* Bottom controls */}
      <div className="sticky bottom-0 z-10 flex items-center justify-around px-4 pt-4 bg-background/95 backdrop-blur border-t border-border shrink-0" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
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

      {/* Upcoming exercises — mobile drawer */}
      <Drawer.Root open={upcomingOpen} onOpenChange={setUpcomingOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Drawer.Content
            className="fixed bottom-0 inset-x-0 z-50 flex flex-col bg-popover rounded-t-2xl border-t border-border focus:outline-none max-h-[70dvh]"
          >
            <Drawer.Title className="sr-only">Upcoming exercises</Drawer.Title>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <span className="font-semibold text-sm">Up next</span>
              <button
                onClick={() => setUpcomingOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-3 py-3">
              <FullProgramList steps={steps} stepIndex={stepIndex} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

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
