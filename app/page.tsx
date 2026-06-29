import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'

export const metadata = { title: 'Chronicon — Fitness Timer' }

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_40px_oklch(0.72_0.22_38_/_30%)]">
          <span className="text-primary-foreground font-black text-xl">C</span>
        </div>
        <span className="font-black text-3xl tracking-tight">Chronicon</span>
      </div>

      {/* Hero */}
      <div className="text-center max-w-lg space-y-4 mb-10">
        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
          Build and run<br />
          <span className="text-primary">custom workouts</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Drag-and-drop workout builder with a built-in interval timer.
          HIIT, circuits, EMOMs, AMRAPs and more.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
        <Link href="/register" className={buttonVariants({ size: 'lg', className: 'text-base px-8' })}>
          Create free account
        </Link>
        <Link
          href="/try"
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'text-base px-8' })}
        >
          Try without signing up
        </Link>
      </div>

      {/* Subtle note */}
      <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs">
        Guest mode: full builder &amp; timer, no account needed.
        Sign up to save workouts, track history, and share programs.
      </p>

      {/* Already have an account */}
      <p className="mt-10 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground transition-colors">
          Log in
        </Link>
      </p>
    </main>
  )
}
