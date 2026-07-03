import type { z } from 'zod'

// Every server action throws on failure — this wraps zod's safeParse so
// invalid input throws a single, readable Error the same way, instead of a
// raw ZodError.
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
      .join('; ')
    throw new Error(message)
  }
  return result.data
}
