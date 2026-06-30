import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChangeEmailForm } from './_components/change-email-form'
import { ChangePasswordForm } from './_components/change-password-form'
import { DeleteAccountSection } from './_components/delete-account-section'
import { ProfileActions } from './_components/profile-actions'

export const metadata = { title: 'Account — Chronotimer' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'User'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <ProfileActions />
          <ChangeEmailForm currentEmail={user.email!} />
          <ChangePasswordForm />
        </div>
        <div>
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  )
}
