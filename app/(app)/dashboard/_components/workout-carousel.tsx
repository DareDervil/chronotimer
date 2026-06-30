'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Play, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Workout {
  id: string
  name: string
  description: string | null
}

export function WorkoutCarousel({ workouts }: { workouts: Workout[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!scrollRef.current) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex gap-4 overflow-x-auto pb-4 -mx-6 md:-mx-10 px-6 md:px-10 snap-x snap-mandatory scrollbar-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      aria-label="Your workouts — use arrow keys to scroll"
    >
      {workouts.map((workout, i) => (
        <WorkoutCard key={workout.id} workout={workout} index={i} />
      ))}
    </div>
  )
}

function WorkoutCard({
  workout,
  index,
}: {
  workout: Workout
  index: number
}) {
  const isFirst = index === 0

  return (
    <div
      className={cn(
        'group relative flex-none snap-start rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-primary/50',
        isFirst
          ? 'w-[80vw] sm:w-[280px] md:w-[340px] bg-primary text-primary-foreground'
          : 'w-[70vw] sm:w-[240px] md:w-[280px] bg-card backdrop-blur-md'
      )}
    >
      {/* Index number watermark */}
      <div
        className={cn(
          'absolute top-4 right-5 text-6xl font-black leading-none select-none pointer-events-none',
          isFirst ? 'text-primary-foreground/15' : 'text-foreground/5'
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="p-6 flex flex-col h-48">
        <div className="flex-1">
          <p
            className={cn(
              'text-[10px] font-bold tracking-[0.2em] uppercase mb-3',
              isFirst ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}
          >
            Workout
          </p>
          <h3 className="text-xl font-black tracking-tight leading-tight line-clamp-2">
            {workout.name}
          </h3>
          {workout.description && (
            <p
              className={cn(
                'text-xs mt-2 line-clamp-2 leading-relaxed',
                isFirst ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {workout.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Link
            href={`/workouts/${workout.id}/run`}
            className={cn(
              'flex items-center gap-2 flex-1 h-9 px-4 rounded-xl text-xs font-bold transition-all',
              isFirst
                ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Play className="h-3 w-3 fill-current" />
            Start
          </Link>
          <Link
            href={`/workouts/${workout.id}/edit`}
            className={cn(
              'flex items-center justify-center h-9 w-9 rounded-xl text-xs font-bold transition-all border',
              isFirst
                ? 'border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
