import { createClient } from '@/lib/supabase/server'

// Every server action needs an authenticated Supabase client + the current
// user. Re-validating via auth.getUser() (rather than trusting a cached
// session) on each call is the Supabase-recommended pattern for server-side
// code — this just collapses that repeated boilerplate into one place.
export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}
