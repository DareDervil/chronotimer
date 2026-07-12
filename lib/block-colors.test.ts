import { describe, expect, it } from 'vitest'
import { BLOCK_META, FALLBACK_STROKE_COLOR } from './block-colors'

describe('BLOCK_META', () => {
  it('maps every known block type to its documented stroke color', () => {
    expect(BLOCK_META.hiit.stroke).toBe('#ef4444')
    expect(BLOCK_META.tabata.stroke).toBe('#f97316')
    expect(BLOCK_META.amrap.stroke).toBe('#3b82f6')
    expect(BLOCK_META.emom.stroke).toBe('#a855f7')
    expect(BLOCK_META.circuit.stroke).toBe('#10b981')
    expect(BLOCK_META.straight_sets.stroke).toBe('#f59e0b')
    expect(BLOCK_META.free.stroke).toBe('#0ea5e9')
    expect(BLOCK_META.rest.stroke).toBe('#64748b')
  })

  it('preserves the existing bar/badge/text/label fields used by the builder timeline', () => {
    expect(BLOCK_META.hiit).toMatchObject({
      bar: 'bg-red-500',
      badge: 'bg-red-500/15 text-red-400 border-red-500/30',
      text: 'text-red-400',
      label: 'HIIT',
    })
  })

  it('has no entry for an unrecognized block type, so callers must use the fallback', () => {
    expect(BLOCK_META['not_a_real_type']).toBeUndefined()
    expect(FALLBACK_STROKE_COLOR).toBe('#9ca3af')
  })
})
