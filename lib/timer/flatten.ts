import type { WorkoutWithStructure, PhaseType, BlockType } from '@/types/database'

export interface TimerStep {
  id: string
  type: 'work' | 'rest'
  exerciseName: string
  label: string
  duration: number   // seconds; always > 0
  isRest: boolean
  isReps: boolean    // true when step is rep-based (no countdown shown)
  repsDisplay: string | null  // e.g. "10 reps" — shown in the ring center
  phaseLabel: string
  blockType: string
}

function phaseLabel(phaseType: PhaseType): string {
  const map: Record<PhaseType, string> = {
    warmup: 'Warm-Up',
    main: 'Main',
    cooldown: 'Cool-Down',
  }
  return map[phaseType] ?? phaseType
}

let _idCounter = 0
function nextId(): string {
  return `step-${++_idCounter}`
}

const DEFAULT_WORK_S = 30
const STRAIGHT_SETS_WORK_S = 5 * 60 // rep-based: user skips when done

function workStep(
  exerciseName: string,
  label: string,
  duration: number,
  pLabel: string,
  bType: string,
  repsDisplay: string | null = null,
): TimerStep {
  return {
    id: nextId(),
    type: 'work',
    exerciseName,
    label,
    duration: duration > 0 ? duration : DEFAULT_WORK_S,
    isRest: false,
    isReps: repsDisplay !== null,
    repsDisplay,
    phaseLabel: pLabel,
    blockType: bType,
  }
}

function restStep(
  exerciseName: string,
  label: string,
  duration: number,
  pLabel: string,
  bType: string,
): TimerStep {
  return {
    id: nextId(),
    type: 'rest',
    exerciseName,
    label,
    duration,
    isRest: true,
    isReps: false,
    repsDisplay: null,
    phaseLabel: pLabel,
    blockType: bType,
  }
}

export function flattenWorkout(workout: WorkoutWithStructure): TimerStep[] {
  _idCounter = 0
  const steps: TimerStep[] = []

  for (const phase of workout.phases ?? []) {
    const pLabel = phaseLabel(phase.phase_type)

    for (const block of phase.blocks ?? []) {
      const cfg = block.config ?? {}
      const bType = block.block_type as BlockType
      const exercises = block.exercises ?? []

      if (bType === 'hiit' || bType === 'tabata') {
        const rounds = cfg.rounds ?? 1
        const workS = cfg.work_s ?? 20
        const restS = cfg.rest_s ?? 10

        for (let r = 0; r < rounds; r++) {
          const roundLabel = `Round ${r + 1} of ${rounds}`
          for (let ei = 0; ei < exercises.length; ei++) {
            const ex = exercises[ei]
            const exName = ex.exercise?.name ?? 'Exercise'
            steps.push(workStep(exName, roundLabel, workS, pLabel, bType))

            // Skip REST after last exercise of last round
            const isLastRound = r === rounds - 1
            const isLastExercise = ei === exercises.length - 1
            if (!(isLastRound && isLastExercise) && restS > 0) {
              steps.push(restStep('Rest', roundLabel, restS, pLabel, bType))
            }
          }
        }
      } else if (bType === 'circuit') {
        const rounds = cfg.rounds ?? 1
        const restBetweenEx = cfg.rest_between_exercises_s ?? 0
        const restBetweenRounds = cfg.rest_between_rounds_s ?? 0

        for (let r = 0; r < rounds; r++) {
          const roundLabel = rounds > 1 ? `Round ${r + 1} of ${rounds}` : 'Circuit'
          for (let ei = 0; ei < exercises.length; ei++) {
            const ex = exercises[ei]
            const exName = ex.exercise?.name ?? 'Exercise'
              steps.push(workStep(exName, roundLabel, ex.duration_s ?? cfg.work_s ?? 0, pLabel, bType))

            const isLastExercise = ei === exercises.length - 1
            if (!isLastExercise && restBetweenEx > 0) {
              steps.push(restStep('Rest', roundLabel, restBetweenEx, pLabel, bType))
            }
          }
          // After each full round except last: rest between rounds
          const isLastRound = r === rounds - 1
          if (!isLastRound && restBetweenRounds > 0) {
            steps.push(restStep('Rest Between Rounds', `Round ${r + 1} complete`, restBetweenRounds, pLabel, bType))
          }
        }
      } else if (bType === 'straight_sets') {
        const sets = cfg.sets ?? 3
        const restBetweenSets = cfg.rest_between_sets_s ?? 60

        for (let ei = 0; ei < exercises.length; ei++) {
          const ex = exercises[ei]
          const exName = ex.exercise?.name ?? 'Exercise'
          const exSets = ex.sets ?? sets
          const isLastExercise = ei === exercises.length - 1

          for (let s = 0; s < exSets; s++) {
            const setLabel = `Set ${s + 1} of ${exSets}`
            const repsDisplay = ex.reps ? `${ex.reps} reps` : null
            steps.push(workStep(exName, setLabel, STRAIGHT_SETS_WORK_S, pLabel, bType, repsDisplay))

            const isLastSet = s === exSets - 1
            if (isLastSet) {
              // Transition rest between exercises (rest_after_s); skip after last exercise
              if (!isLastExercise && (ex.rest_after_s ?? 0) > 0) {
                steps.push(restStep('Rest', `${exName} complete`, ex.rest_after_s, pLabel, bType))
              }
            } else {
              // Inter-set rest (rest_between_sets_s)
              if (restBetweenSets > 0) {
                steps.push(restStep('Rest', setLabel, restBetweenSets, pLabel, bType))
              }
            }
          }
        }
      } else if (bType === 'emom') {
        const intervalS = cfg.interval_s ?? 60
        const totalS = cfg.total_duration_s ?? 600
        const cycles = Math.floor(totalS / intervalS)

        for (let c = 0; c < cycles; c++) {
          const ex = exercises[c % exercises.length]
          const exName = ex.exercise?.name ?? 'Exercise'
          const label = `Minute ${c + 1} of ${cycles}`
          steps.push(workStep(exName, label, intervalS, pLabel, bType))
        }
      } else if (bType === 'amrap') {
        const totalS = cfg.total_duration_s ?? 600
        const exerciseNames = exercises.map((e) => e.exercise?.name ?? 'Exercise').join(', ')
        steps.push(workStep(exerciseNames, 'AMRAP', totalS, pLabel, bType))
      } else if (bType === 'free') {
        const mode = cfg.mode ?? 'time'
        for (let ei = 0; ei < exercises.length; ei++) {
          const ex = exercises[ei]
          const exName = ex.exercise?.name ?? 'Exercise'
          if (mode === 'reps') {
            const reps = ex.reps ?? cfg.reps
            const repsDisplay = reps ? `${reps} reps` : 'Complete reps'
            steps.push(workStep(exName, repsDisplay, STRAIGHT_SETS_WORK_S, pLabel, bType, repsDisplay))
          } else {
            const duration = ex.duration_s ?? cfg.work_s ?? DEFAULT_WORK_S
            steps.push(workStep(exName, 'Free', duration, pLabel, bType))
          }
          const isLastExercise = ei === exercises.length - 1
          const restDuration = ex.rest_after_s > 0 ? ex.rest_after_s : (cfg.rest_between_exercises_s ?? 0)
          if (!isLastExercise && restDuration > 0) {
            steps.push(restStep('Rest', exName, restDuration, pLabel, bType))
          }
        }
      } else if (bType === 'rest') {
        const restS = cfg.rest_s ?? 60
        steps.push(restStep('Rest', '', restS, pLabel, bType))
      }
    }
  }

  return steps
}
