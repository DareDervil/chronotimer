'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ProfileActions() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Preferences
      </h2>
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {mounted && theme === 'dark'
              ? <Moon className="h-4 w-4" />
              : <Sun className="h-4 w-4" />}
            <span>Theme</span>
          </div>
          <span className="text-muted-foreground capitalize">
            {mounted ? theme : ''}
          </span>
        </button>

        <Link
          href="/about"
          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-colors"
        >
          <Info className="h-4 w-4" />
          About Chronotimer
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
