import { describe, expect, it } from 'vitest'
import { toggleSelected, resolveSelected } from './selection'
import type { Exercise } from '@/types/database'

function exercise(id: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id,
    name: `Exercise ${id}`,
    category: 'strength',
    primary_muscles: [],
    secondary_muscles: [],
    equipment: [],
    description: null,
    instructions: null,
    video_url: null,
    is_custom: false,
    created_by: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('toggleSelected', () => {
  it('appends an id that is not yet selected', () => {
    expect(toggleSelected([], 'a')).toEqual(['a'])
    expect(toggleSelected(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('removes an id that is already selected', () => {
    expect(toggleSelected(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('re-selecting a deselected id appends it at the end, not its original position', () => {
    let ids = toggleSelected([], 'a')
    ids = toggleSelected(ids, 'b')
    ids = toggleSelected(ids, 'a') // deselect a
    ids = toggleSelected(ids, 'a') // reselect a
    expect(ids).toEqual(['b', 'a'])
  })
})

describe('resolveSelected', () => {
  it('returns exercises in selection order, not list order', () => {
    const exercises = [exercise('1'), exercise('2'), exercise('3')]
    expect(resolveSelected(exercises, ['3', '1'])).toEqual([exercise('3'), exercise('1')])
  })

  it('returns an empty array when nothing is selected', () => {
    expect(resolveSelected([exercise('1')], [])).toEqual([])
  })

  it('silently skips ids that no longer exist in the exercise list', () => {
    const exercises = [exercise('1')]
    expect(resolveSelected(exercises, ['1', 'missing'])).toEqual([exercise('1')])
  })
})
