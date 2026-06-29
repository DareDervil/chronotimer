'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase exchanges the recovery token from the URL hash automatically.
  // Wait for the PASSWORD_RECOVERY event before showing the form.
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password updated — you are now logged in')
    router.push('/dashboard')
  }

  if (!ready) {
    return (
      <Card className="w-full shadow-[0_8px_48px_oklch(0_0_0_/_20%)] dark:shadow-[0_8px_48px_oklch(0_0_0_/_50%)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-sm">Chronicon</span>
          </div>
          <CardTitle className="text-xl">Reset password</CardTitle>
          <CardDescription>Verifying your reset link…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-[0_8px_48px_oklch(0_0_0_/_20%)] dark:shadow-[0_8px_48px_oklch(0_0_0_/_50%)]">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-sm">Chronicon</span>
        </div>
        <CardTitle className="text-xl">Set new password</CardTitle>
        <CardDescription>Choose a new password for your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
