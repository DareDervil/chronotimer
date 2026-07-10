'use client'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={unstable_retry}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
