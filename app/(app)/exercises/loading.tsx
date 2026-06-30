export default function ExercisesLoading() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>

      {/* Search + new button */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 max-w-sm rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Equipment filter pills */}
      <div className="flex flex-wrap gap-2">
        {[48, 80, 64, 72, 56, 88, 60].map((w, i) => (
          <div key={i} className="h-6 rounded-full bg-muted animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {[96, 80, 88, 72].map((w, i) => (
          <div key={i} className="h-9 rounded-md bg-muted animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Exercise cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
