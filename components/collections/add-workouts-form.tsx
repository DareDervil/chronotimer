'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { addWorkoutToCollection } from '@/lib/actions/collections'

interface Workout {
  id: string
  name: string
}

export function AddWorkoutsForm({
  collectionId,
  workouts,
}: {
  collectionId: string
  workouts: Workout[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function handleAdd(workoutId: string) {
    setPending(workoutId)
    try {
      await addWorkoutToCollection(collectionId, workoutId)
      router.refresh()
    } catch (err) {
      if (err instanceof Error && err.message === 'already_in_collection') {
        toast.error('Already in this collection')
        router.refresh()
      } else {
        toast.error('Something went wrong')
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-1">
      {workouts.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3"
        >
          <span className="text-sm font-medium">{w.name}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAdd(w.id)}
            disabled={pending === w.id}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {pending === w.id ? 'Adding…' : 'Add'}
          </Button>
        </div>
      ))}
    </div>
  )
}
