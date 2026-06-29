'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cloneWorkout } from '@/lib/actions/workouts'

export function CopyWorkoutButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleCopy() {
    setPending(true)
    try {
      await cloneWorkout(slug)
      router.push('/workouts')
    } catch {
      toast.error('Failed to copy workout')
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      {pending ? 'Copying…' : 'Copy to my workouts'}
    </button>
  )
}
