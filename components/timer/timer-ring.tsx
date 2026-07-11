'use client'

interface TimerRingProps {
  duration: number
  timeLeft: number
  isRest: boolean
  isReps?: boolean
  repsDisplay?: string | null
}

function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  return String(seconds)
}

const RADIUS = 80
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ~502.65

export function TimerRing({ duration, timeLeft, isRest, isReps = false, repsDisplay }: TimerRingProps) {
  const progress = isReps ? 1 : (duration > 0 ? timeLeft / duration : 0)
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const strokeColor = isRest ? 'hsl(215,70%,60%)' : 'hsl(25,95%,55%)'

  return (
    <div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96">
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={100}
          cy={100}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={10}
        />
        {/* Progress arc */}
        <circle
          cx={100}
          cy={100}
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={isReps ? undefined : { transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      {/* Center display */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isReps ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl sm:text-5xl md:text-6xl font-bold">{repsDisplay ?? 'Reps'}</span>
          </div>
        ) : (
          <span className="text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums">{formatTime(timeLeft)}</span>
        )}
      </div>
    </div>
  )
}
