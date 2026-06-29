'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type Values = z.infer<typeof schema>

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: Values) {
    setLoading(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.updateUser({ email: values.email })
      if (error) throw error
      toast.success(
        'Confirmation emails sent to both addresses. Follow the links to confirm your new email.'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change email</CardTitle>
        <CardDescription>
          A confirmation link will be sent to both your current and new address.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-email">New email address</Label>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              placeholder={currentEmail}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Update email'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
