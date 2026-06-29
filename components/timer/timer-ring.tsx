'use client'

interface TimerRingProps {
  duration: number
  timeLeft: number
  isRest: boolean
  isReps?: boolean
  repsDisplay?: string | null
  size?: number
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

export function TimerRing({ duration, timeLeft, isRest, isReps = false, repsDisplay, size = 240 }: TimerRingProps) {
  const progress = isReps ? 1 : (duration > 0 ? timeLeft / duration : 0)
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const strokeColor = isRest ? 'hsl(215,70%,60%)' : 'hsl(25,95%,55%)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
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
            <span className="text-4xl font-bold">{repsDisplay ?? 'Reps'}</span>
          </div>
        ) : (
          <span className="text-4xl font-bold tabular-nums">{formatTime(timeLeft)}</span>
        )}
      </div>
    </div>
  )
}
