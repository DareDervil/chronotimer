import { describe, expect, it } from 'vitest'
import { groupUpcomingSteps, buildProgramRows } from './group-steps'
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

describe('buildProgramRows', () => {
  it('includes every step in order with no collapsing, including rests', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0', label: 'Round 1 of 2' }),
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, label: 'Round 1 of 2' }),
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0', label: 'Round 2 of 2' }),
    ]
    const rows = buildProgramRows(steps, 0)
    const stepRows = rows.filter((r) => r.kind === 'step')

    expect(stepRows).toHaveLength(3)
    expect(stepRows.map((r) => (r.kind === 'step' ? r.exerciseName : ''))).toEqual(['Squat', 'Rest', 'Squat'])
    expect(stepRows.map((r) => (r.kind === 'step' ? r.setLabel : ''))).toEqual(['Round 1 of 2', 'Round 1 of 2', 'Round 2 of 2'])
  })

  it('excludes steps before stepIndex', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Push-up', blockId: 'b0', bexId: 'e1' }),
    ]
    const rows = buildProgramRows(steps, 1)
    const stepRows = rows.filter((r) => r.kind === 'step')

    expect(stepRows.map((r) => (r.kind === 'step' ? r.exerciseName : ''))).toEqual(['Push-up'])
  })

  it('inserts a divider before the first row and whenever the block changes', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0', blockType: 'hiit', phaseLabel: 'Main' }),
      step({ exerciseName: 'Plank', blockId: 'b1', bexId: 'e0', blockType: 'circuit', phaseLabel: 'Main' }),
    ]
    const rows = buildProgramRows(steps, 0)

    expect(rows.map((r) => r.kind)).toEqual(['divider', 'step', 'divider', 'step'])
    expect(rows[0]).toMatchObject({ kind: 'divider', label: 'Main · HIIT' })
    expect(rows[2]).toMatchObject({ kind: 'divider', label: 'Main · Circuit' })
  })

  it('marks isCurrent only on the row at stepIndex', () => {
    const steps = [
      step({ exerciseName: 'Squat', blockId: 'b0', bexId: 'e0' }),
      step({ exerciseName: 'Push-up', blockId: 'b0', bexId: 'e1' }),
    ]
    const rows = buildProgramRows(steps, 1)
    const stepRows = rows.filter((r) => r.kind === 'step')

    expect(stepRows.map((r) => (r.kind === 'step' ? r.isCurrent : false))).toEqual([true])
  })

  it('rest rows use blockType "rest" regardless of the parent block type', () => {
    const steps = [
      step({ exerciseName: 'Rest', blockId: 'b0', bexId: null, isRest: true, blockType: 'hiit' }),
    ]
    const rows = buildProgramRows(steps, 0)
    const stepRow = rows.find((r) => r.kind === 'step')

    expect(stepRow).toMatchObject({ blockType: 'rest', isRest: true })
  })

  it('keys reps-based rows off repsDisplay, not duration', () => {
    const steps = [
      step({ exerciseName: 'Deadlift', blockId: 'b0', bexId: 'e0', isReps: true, repsDisplay: '10 reps', duration: 300 }),
    ]
    const rows = buildProgramRows(steps, 0)
    const stepRow = rows.find((r) => r.kind === 'step')

    expect(stepRow).toMatchObject({ durationLabel: '10 reps' })
  })
})
