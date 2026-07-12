import { describe, expect, it } from 'vitest'
import { groupUpcomingSteps } from './group-steps'
import type { TimerStep } from './flatten'

let _n = 0
function step(overrides: Partial<TimerStep>): TimerStep {
  _n++
  return {
    id: `s${_n}`,
    type: 'work',
    exerciseName: 'Exercise',
    label: '',
    duration: 20,
    isRest: false,
    isReps: false,
    repsDisplay: null,
    phaseLabel: 'Main',
    blockType: 'hiit',
    blockId: 'b0',
    bexId: 'e0',
    ...overrides,
  }
}

describe('groupUpcomingSteps — basic collapsing', () => {
  it('collapses repeated occurrences of the same (blockId, bexId) into one row', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0', duration: 20 }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, duration: 10 }),
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0', duration: 20 }),
    ]
    const groups = groupUpcomingSteps(steps, 0)

    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ exerciseName: 'Squat', blockType: 'hiit', durationLabel: '20s', isCurrent: true })
  })

  it('excludes rest steps entirely', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true }),
    ]
    const groups = groupUpcomingSteps(steps, 0)

    expect(groups.map((g) => g.exerciseName)).toEqual(['Squat'])
  })

  it('drops a group once every one of its steps is behind stepIndex', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Push-up', blockId: 'b0', bexId: 'e1' }),
    ]
    const groups = groupUpcomingSteps(steps, 1)

    expect(groups.map((g) => g.exerciseName)).toEqual(['Push-up'])
  })

  it('produces one row for an AMRAP block keyed on blockId alone', () => {
    const steps = [
      step({ exerciseName: 'Burpee, Mountain Climber', blockId: 'b1', bexId: null, blockType: 'amrap', duration: 600 }),
    ]
    const groups = groupUpcomingSteps(steps, 0)

    expect(groups).toEqual([
      { key: 'b1:block', blockType: 'amrap', exerciseName: 'Burpee, Mountain Climber', durationLabel: '10:00', isCurrent: true },
    ])
  })

  it('keys reps-based steps off repsDisplay, not duration', () => {
    const steps = [
      step({ exerciseName: 'Deadlift', blockId: 'b0', bexId: 'e0', isReps: true, repsDisplay: '10 reps', duration: 300 }),
    ]
    const groups = groupUpcomingSteps(steps, 0)

    expect(groups[0].durationLabel).toBe('10 reps')
  })

  it('two different exercises sharing a display name in the same block get separate rows', () => {
    const steps = [
      step({ exerciseName: 'Push-up', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Push-up', blockId: 'b0', bexId: 'e1' }),
    ]
    const groups = groupUpcomingSteps(steps, 0)

    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.key)).toEqual(['b0:e0', 'b0:e1'])
  })
})

describe('groupUpcomingSteps — current-row ordering', () => {
  it('puts the current group first even for a simple in-order sequence', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Push-up', blockId: 'b0', bexId: 'e1' }),
      step({ exerciseName: 'Plank', blockId: 'b0', bexId: 'e2' }),
    ]
    const groups = groupUpcomingSteps(steps, 1)

    expect(groups.map((g) => g.exerciseName)).toEqual(['Push-up', 'Plank'])
    expect(groups[0].isCurrent).toBe(true)
  })

  it('EMOM interleaving: the active exercise is always row 0, even when its group was inserted after another', () => {
    // EMOM round-robin: Burpee (e0) at minutes 1 & 3, Mountain Climber (e1) at minutes 2 & 4
    const steps = [
      step({ exerciseName: 'Burpee', blockId: 'b0', bexId: 'e0', blockType: 'emom', duration: 60 }),
      step({ exerciseName: 'Mountain Climber', blockId: 'b0', bexId: 'e1', blockType: 'emom', duration: 60 }),
      step({ exerciseName: 'Burpee', blockId: 'b0', bexId: 'e0', blockType: 'emom', duration: 60 }),
      step({ exerciseName: 'Mountain Climber', blockId: 'b0', bexId: 'e1', blockType: 'emom', duration: 60 }),
    ]

    // At stepIndex 1 (Mountain Climber's first turn), Burpee's group was inserted
    // first (its first occurrence is step 0) but isn't active — Mountain Climber must
    // still be row 0.
    const atMinute2 = groupUpcomingSteps(steps, 1)
    expect(atMinute2.map((g) => g.exerciseName)).toEqual(['Mountain Climber', 'Burpee'])
    expect(atMinute2[0].isCurrent).toBe(true)

    // At stepIndex 3 (Mountain Climber's second/last turn), Burpee's last occurrence
    // (index 2) is behind stepIndex, so it has dropped out entirely.
    const atMinute4 = groupUpcomingSteps(steps, 3)
    expect(atMinute4.map((g) => g.exerciseName)).toEqual(['Mountain Climber'])
  })
})
