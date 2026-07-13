import type { Exercise } from '@/types/database'

export function toggleSelected(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((existingId) => existingId !== id)
    : [...selectedIds, id]
}

export function resolveSelected(exercises: Exercise[], selectedIds: string[]): Exercise[] {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const resolved: Exercise[] = []
  for (const id of selectedIds) {
    const exercise = byId.get(id)
    if (exercise) resolved.push(exercise)
  }
  return resolved
}
