'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteAccount } from '@/lib/actions/account'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function DeleteAccountSection() {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirmed) return
    setLoading(true)
    try {
      await deleteAccount()
      router.push('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader className="border-b border-destructive/20">
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>
          This permanently deletes your account and all your data. Workouts others have
          copied remain unaffected.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border border-input accent-destructive cursor-pointer"
          />
          <span className="text-sm text-muted-foreground leading-snug">
            I understand this action is permanent and cannot be undone
          </span>
        </label>
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          disabled={!confirmed || loading}
          onClick={handleDelete}
        >
          {loading ? 'Deleting account...' : 'Delete my account'}
        </Button>
      </CardFooter>
    </Card>
  )
}
