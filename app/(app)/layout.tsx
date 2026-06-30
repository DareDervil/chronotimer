import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from './_components/sidebar-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getSession reads the JWT from the cookie (no network) — use the user ID
  // to start the profile fetch in parallel with the authoritative getUser() check
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    session?.user?.id
      ? supabase.from('profiles').select('display_name, avatar_url').eq('id', session.user.id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <SidebarNav user={user} profile={profile} />

      {/* Content offset for sidebar on desktop, bottom bar on mobile */}
      <main className="relative z-10 md:ml-[60px] md:!pb-0 min-h-screen" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        {children}
      </main>
    </div>
  )
}
