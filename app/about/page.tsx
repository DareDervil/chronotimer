import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata = { title: 'About — Chronotimer' }

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_30px_oklch(0.72_0.22_38_/_25%)]">
              <span className="text-primary-foreground font-black text-lg">C</span>
            </div>
            <span className="font-black text-2xl tracking-tight">Chronotimer</span>
          </div>

          {/* About */}
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
                Chronotimer is a free,{' '}
              <a
                href="https://github.com/DareDervil/chronotimer"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                open-source
              </a>{' '}
              fitness timer built for people who want structured workouts without the complexity of a full training app.
            </p>
            <p>
              Built and maintained by{' '}
            <a
              href="mailto:hello@chronotimer.gr"
              className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Dimitrios Tsioumas
            </a>
            .
            </p>
          </div>

          {/* Credits */}
          <div className="border-t border-border/50 pt-6 space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Credits</p>
            <p>
              Exercise data sourced from{' '}
              <a
                href="https://wger.de"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                wger Workout Manager
              </a>{' '}
              under{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/3.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                CC BY-SA 3.0
              </a>
              .
            </p>
          </div>

          {/* Back */}
          <Link href="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            &larr; Back to home
          </Link>

        </div>
      </main>
      <Footer />
    </div>
  )
}
