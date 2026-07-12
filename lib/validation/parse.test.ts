import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseOrThrow } from './parse'

describe('parseOrThrow', () => {
  const schema = z.object({ name: z.string().min(1, 'name is required') })

  it('returns the parsed data on success', () => {
    expect(parseOrThrow(schema, { name: 'Squat' })).toEqual({ name: 'Squat' })
  })

  it('throws a readable Error with the field path on failure', () => {
    expect(() => parseOrThrow(schema, { name: '' })).toThrow('name: name is required')
  })

  it('joins multiple issues with a semicolon', () => {
    const multi = z.object({ a: z.string().min(1), b: z.string().min(1) })
    expect(() => parseOrThrow(multi, { a: '', b: '' })).toThrow(/a: .+; b: .+/)
  })
})
