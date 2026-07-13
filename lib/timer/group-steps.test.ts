import { describe, expect, it } from 'vitest'
import { buildProgramRows } from './group-steps'
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
