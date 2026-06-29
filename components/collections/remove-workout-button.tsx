'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeWorkoutFromCollection } from '@/lib/actions/collections'

export function RemoveWorkoutButton({
  collectionId,
  workoutId,
}: {
  collectionId: string
  workoutId: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleRemove() {
    setPending(true)
    try {
      await removeWorkoutFromCollection(collectionId, workoutId)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleRemove}
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      title="Remove from collection"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  )
}
