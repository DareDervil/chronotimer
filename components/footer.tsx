import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 py-6 px-4 mt-auto">
      <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          &copy; {new Date().getFullYear()} Dimitrios Tsioumas &mdash;{' '}
          <Link href="/about" className="underline underline-offset-4 hover:text-foreground transition-colors">
            About
          </Link>
          {' '}&mdash;{' '}
          <a
            href="https://github.com/DareDervil/chronotimer"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </span>
        <span>
          Exercise data:{' '}
          <a
            href="https://wger.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            wger
          </a>{' '}
          &mdash; CC BY-SA 3.0
        </span>
      </div>
    </footer>
  )
}
