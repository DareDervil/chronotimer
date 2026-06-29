'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActiveWorkout } from '@/components/timer/active-workout'
import type { WorkoutWithStructure } from '@/types/database'

const STORAGE_KEY = 'chronicon:guest-workout'

export default function GuestRunPage() {
  const router = useRouter()
  const [workout, setWorkout] = useState<WorkoutWithStructure | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) {
        router.replace('/try')
        return
      }
      const parsed = JSON.parse(raw) as WorkoutWithStructure
      setWorkout(parsed)
    } catch {
      router.replace('/try')
      return
    }
    setReady(true)
  }, [router])

  if (!ready || !workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return <ActiveWorkout workout={workout} guestMode />
}
