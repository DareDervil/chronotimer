'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addWorkoutToCollection, removeWorkoutFromCollection } from '@/lib/actions/collections'
import { useRouter } from 'next/navigation'

interface Workout {
  id: string
  name: string
}

interface CollectionEntry {
  id: string
  name: string
  hasWorkout: boolean
}

interface AddWorkoutToCollectionProps {
  workout: Workout
  collections: CollectionEntry[]
}

export function AddWorkoutToCollection({ workout, collections }: AddWorkoutToCollectionProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(collections.map((c) => [c.id, c.hasWorkout]))
  )

  async function handleToggle(collectionId: string) {
    setPending(collectionId)
    try {
      if (state[collectionId]) {
        await removeWorkoutFromCollection(collectionId, workout.id)
        setState((s) => ({ ...s, [collectionId]: false }))
      } else {
        await addWorkoutToCollection(collectionId, workout.id)
        setState((s) => ({ ...s, [collectionId]: true }))
      }
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" title="Add to collection" />
        }
      >
        <Plus className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">{workout.name}</p>

        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No collections yet. Create one first.
          </p>
        ) : (
          <div className="space-y-1 pt-1">
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => handleToggle(col.id)}
                disabled={pending === col.id}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-sm disabled:opacity-60"
              >
                <span className="font-medium">{col.name}</span>
                {state[col.id] && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
