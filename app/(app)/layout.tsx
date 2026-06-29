import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from './_components/sidebar-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen">
      <SidebarNav user={user} profile={profile} />

      {/* Content offset for sidebar on desktop, bottom bar on mobile */}
      <main className="relative z-10 md:ml-[60px] pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
