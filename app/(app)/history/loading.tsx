export default function HistoryLoading() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="h-7 w-24 rounded bg-muted animate-pulse" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>

      {/* Heatmap card */}
      <div>
        <div className="h-5 w-20 rounded bg-muted animate-pulse mb-3" />
        <div className="h-36 rounded-xl bg-muted animate-pulse" />
      </div>

      {/* Session list */}
      <div>
        <div className="h-5 w-32 rounded bg-muted animate-pulse mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
