'use client'

import { useState } from 'react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' }
const CELL_SIZE = 13 // px, controls gap too
const WEEKS = 52

function toKey(d: Date): string {
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD
}

function cellColor(count: number): string {
  if (count === 0) return 'bg-muted'
  if (count === 1) return 'bg-primary/30'
  if (count === 2) return 'bg-primary/60'
  return 'bg-primary'
}

function buildGrid(): { key: string; date: Date }[][] {
  // Start from Sunday 52 weeks ago
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  start.setDate(start.getDate() - today.getDay() - WEEKS * 7)

  const weeks: { key: string; date: Date }[][] = []
  const cursor = new Date(start)

  for (let w = 0; w <= WEEKS; w++) {
    const week: { key: string; date: Date }[] = []
    for (let d = 0; d < 7; d++) {
      week.push({ key: toKey(cursor), date: new Date(cursor) })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    if (toKey(cursor) > toKey(today)) break
  }

  return weeks
}

function buildMonthLabels(weeks: { key: string; date: Date }[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const month = week[0].date.getMonth()
    if (month !== lastMonth) {
      labels.push({ label: MONTHS[month], col })
      lastMonth = month
    }
  })
  return labels
}

interface ActivityHeatmapProps {
  data: Record<string, number>
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const weeks = buildGrid()
  const monthLabels = buildMonthLabels(weeks)
  const today = toKey(new Date())
  const [tapped, setTapped] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto pb-1" onClick={() => setTapped(null)}>
      <div className="inline-flex gap-3 min-w-max">
        {/* Day labels column */}
        <div className="flex flex-col justify-end" style={{ marginTop: 18 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              style={{ height: CELL_SIZE, marginBottom: 2 }}
              className="text-[9px] text-muted-foreground leading-none flex items-center"
            >
              {DAY_LABELS[i] ?? ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div>
          {/* Month labels */}
          <div className="relative flex mb-1" style={{ height: 14 }}>
            {monthLabels.map(({ label, col }) => (
              <div
                key={`${label}-${col}`}
                className="absolute text-[9px] text-muted-foreground"
                style={{ left: col * (CELL_SIZE + 2) }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Columns (weeks) */}
          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map(({ key, date }) => {
                  const count = data[key] ?? 0
                  const isFuture = key > today
                  const label = isFuture
                    ? ''
                    : count > 0
                    ? `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${count} session${count > 1 ? 's' : ''}`
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <div
                      key={key}
                      title={label}
                      onClick={(e) => {
                        if (isFuture || !label) return
                        e.stopPropagation()
                        setTapped(tapped === key ? null : key)
                      }}
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      className={`rounded-sm transition-opacity cursor-pointer ${
                        isFuture ? 'opacity-0 pointer-events-none' : cellColor(count)
                      } ${tapped === key ? 'ring-1 ring-foreground/60' : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end text-[9px] text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3].map((n) => (
          <div
            key={n}
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
            className={`rounded-sm ${cellColor(n)}`}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tap tooltip for mobile */}
      {tapped && (() => {
        const count = data[tapped] ?? 0
        const date = new Date(tapped + 'T00:00:00')
        const label = count > 0
          ? `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${count} session${count > 1 ? 's' : ''}`
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        return (
          <p className="mt-2 text-xs text-center text-muted-foreground">{label}</p>
        )
      })()}
    </div>
  )
}
