'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  History,
  Sun,
  Moon,
  LogOut,
  Plus,
  FolderOpen,
  Info,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Profile {
  display_name: string | null
  avatar_url: string | null
}

interface SidebarNavProps {
  user: User
  profile: Profile | null
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/collections', label: 'Collections', icon: FolderOpen },
  { href: '/exercises', label: 'Exercises', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
]

export function SidebarNav({ user, profile }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'User'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="group/sidebar hidden md:flex flex-col fixed left-0 top-0 h-full z-50 w-[60px] hover:w-[220px] transition-all duration-300 ease-in-out border-r border-border/50 bg-background/80 backdrop-blur-xl overflow-hidden">

        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border/50 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-black text-sm">C</span>
          </div>
          <span className="ml-3 font-black text-base tracking-tight whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
            Chronotimer
          </span>
        </div>

        {/* Quick action */}
        <div className="px-3 py-3 border-b border-border/50 shrink-0">
          <Link
            href="/workouts/new"
            className="flex items-center gap-3 h-9 px-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
              New Workout
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-0.5 p-2 overflow-hidden">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 h-10 px-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                  {label}
                </span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-2 border-t border-border/50 flex flex-col gap-0.5 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 h-10 px-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors w-full"
          >
            <Sun className="h-[18px] w-[18px] shrink-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
            <Moon className="h-[18px] w-[18px] shrink-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 ml-7">
              {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Theme'}
            </span>
          </button>

          {/* About */}
          <Link
            href="/about"
            className="flex items-center gap-3 h-10 px-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <Info className="h-[18px] w-[18px] shrink-0" />
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
              About
            </span>
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 h-10 px-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
              Sign out
            </span>
          </button>

          {/* User avatar */}
          <Link
            href="/profile"
            className="flex items-center gap-3 h-10 px-2.5 mt-1 hover:bg-secondary/60 rounded-lg transition-colors cursor-pointer"
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 min-w-0">
              <p className="text-xs font-semibold truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom bar ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 border-t border-border/50 bg-background/90 backdrop-blur-xl flex items-center justify-around px-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-xl transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <Link
          href="/workouts/new"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-primary"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center -mt-6 shadow-[0_0_20px_oklch(0.72_0.22_38_/_40%)]">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-[10px] font-medium">New</span>
        </Link>
      </nav>
    </>
  )
}
