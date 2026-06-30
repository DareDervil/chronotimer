export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="px-6 md:px-10 pt-10 pb-8 border-b border-border/40 max-w-6xl mx-auto w-full">
        <div className="h-2.5 w-20 rounded bg-muted animate-pulse mb-3" />
        <div className="h-16 md:h-24 w-56 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-3 mt-8">
          <div className="pr-4 md:pr-6 border-r border-border space-y-2">
            <div className="h-8 w-10 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="px-4 md:px-6 border-r border-border space-y-2">
            <div className="h-8 w-10 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="pl-4 md:pl-6 space-y-2">
            <div className="h-8 w-16 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </section>

      {/* Workout carousel */}
      <section className="px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
        <div className="h-2.5 w-24 rounded bg-muted animate-pulse mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[280, 240, 240].map((w, i) => (
            <div
              key={i}
              className="flex-none h-48 rounded-2xl bg-muted animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
