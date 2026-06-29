'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteAccount(): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.rpc('delete_user_account')
  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()
  return { success: true }
}
