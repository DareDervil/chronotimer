'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
  }

  return (
    <Card className="w-full shadow-[0_8px_48px_oklch(0_0_0_/_20%)] dark:shadow-[0_8px_48px_oklch(0_0_0_/_50%)]">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-sm">Chronotimer</span>
        </div>
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>
          {sent
            ? 'Check your inbox for a reset link.'
            : "Enter your email and we'll send you a reset link."}
        </CardDescription>
      </CardHeader>

      {!sent && (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Remember it?{' '}
              <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-primary">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}

      {sent && (
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Didn&apos;t receive it?{' '}
            <button
              onClick={() => setSent(false)}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Try again
            </button>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
