'use server'

import { requireUser } from '@/lib/actions/require-user'

export async function deleteAccount(): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase.rpc('delete_user_account')
  if (error) throw new Error(error.message)

  await supabase.auth.signOut()
}
