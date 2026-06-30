'use client'

import { useState, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useDraggable } from '@dnd-kit/core'
import { Search, GripVertical, Plus } from 'lucide-react'
import type { Exercise, ExerciseCategory } from '@/types/database'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  warmup: 'Warm-up',
  cardio: 'Cardio',
  strength: 'Strength',
  mobility: 'Mobility',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  'none (bodyweight exercise)': 'Bodyweight',
  'Barbell': 'Barbell',
  'SZ-Bar': 'SZ-Bar',
  'Dumbbell': 'Dumbbell',
  'Gym mat': 'Gym Mat',
  'Swiss Ball': 'Swiss Ball',
  'Pull-up bar': 'Pull-up Bar',
  'Bench': 'Bench',
  'Incline bench': 'Incline Bench',
  'Kettlebell': 'Kettlebell',
  'Resistance band': 'Resistance Band',
}

const CATEGORIES: ExerciseCategory[] = ['warmup', 'cardio', 'strength', 'mobility']

type SidebarTab = ExerciseCategory | 'custom'

interface ExerciseSidebarProps {
  exercises: Exercise[]
  onTapAdd?: (exercise: Exercise) => void
}

export function ExerciseSidebar({ exercises, onTapAdd }: ExerciseSidebarProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<SidebarTab>('warmup')
  const [equipFilter, setEquipFilter] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const customExercises = useMemo(() => exercises.filter((ex) => ex.is_custom), [exercises])

  const allEquipment = useMemo(() => {
    if (activeCategory === 'custom') return []
    const set = new Set<string>()
    for (const ex of exercises) {
      if (!ex.is_custom && ex.category === activeCategory) {
        for (const eq of ex.equipment) set.add(eq)
        if (ex.equipment.length === 0) set.add('none (bodyweight exercise)')
      }
    }
    return Array.from(set).sort((a, b) => {
      if (a === 'none (bodyweight exercise)') return -1
      if (b === 'none (bodyweight exercise)') return 1
      return a.localeCompare(b)
    })
  }, [exercises, activeCategory])

  const availableCategories = useMemo(() => {
    const counts: Partial<Record<ExerciseCategory, number>> = {}
    for (const e of exercises) {
      if (!e.is_custom) counts[e.category] = (counts[e.category] ?? 0) + 1
    }
    return counts
  }, [exercises])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (q) {
      return exercises.filter((ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.description?.toLowerCase().includes(q) ||
        ex.instructions?.toLowerCase().includes(q)
      )
    }
    if (activeCategory === 'custom') return customExercises
    return exercises.filter((ex) => {
      if (ex.is_custom) return false
      if (ex.category !== activeCategory) return false
      if (equipFilter) {
        if (equipFilter === 'none (bodyweight exercise)') {
          if (ex.equipment.length > 0 && !ex.equipment.includes('none (bodyweight exercise)')) return false
        } else {
          if (!ex.equipment.includes(equipFilter)) return false
        }
      }
      return true
    })
  }, [exercises, search, activeCategory, equipFilter, customExercises])

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 44,
    overscan: 8,
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative p-3 pb-2 shrink-0">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <>
          <div className="flex flex-col gap-0.5 px-2 pb-2 shrink-0">
            {CATEGORIES.filter((c) => availableCategories[c]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setActiveCategory(cat); setEquipFilter(null) }}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                  activeCategory === cat
                    ? 'bg-foreground/10 font-medium'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="text-xs text-muted-foreground">{availableCategories[cat]}</span>
              </button>
            ))}
            {customExercises.length > 0 && (
              <button
                type="button"
                onClick={() => { setActiveCategory('custom'); setEquipFilter(null) }}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors text-left',
                  activeCategory === 'custom'
                    ? 'bg-foreground/10 font-medium'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                <span>Custom</span>
                <span className="text-xs text-muted-foreground">{customExercises.length}</span>
              </button>
            )}
          </div>

          {/* Equipment filter */}
          {allEquipment.length > 0 && (
            <div className="px-2 pb-2 flex flex-wrap gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setEquipFilter(null)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                  !equipFilter
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                )}
              >
                All
              </button>
              {allEquipment.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => setEquipFilter(equipFilter === eq ? null : eq)}
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                    equipFilter === eq
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  )}
                >
                  {EQUIPMENT_LABELS[eq] ?? eq}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="h-px bg-border mx-3 shrink-0" />

      {/* Exercise list — virtualized */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto touch-pan-y p-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No exercises found</p>
        ) : (
          <div
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: '4px',
                }}
              >
                <DraggableExercise
                  exercise={filtered[virtualItem.index]}
                  onTapAdd={onTapAdd}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableExercise({ exercise, onTapAdd }: { exercise: Exercise; onTapAdd?: (exercise: Exercise) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar:${exercise.id}`,
    data: { type: 'sidebar', exercise },
  })

  const equipLabel = exercise.equipment
    .filter((e) => e !== 'none (bodyweight exercise)')
    .map((e) => EQUIPMENT_LABELS[e] ?? e)
    .slice(0, 1)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-1.5 rounded-md border bg-card px-2 py-1.5 text-sm cursor-default h-full',
        isDragging && 'opacity-40'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0 hidden md:flex"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 truncate text-sm leading-tight">{exercise.name}</span>
      {equipLabel.length > 0 ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">
          {equipLabel[0]}
        </span>
      ) : (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">
          BW
        </span>
      )}
      {onTapAdd && (
        <button
          type="button"
          onClick={() => onTapAdd(exercise)}
          className="text-muted-foreground hover:text-primary transition-colors shrink-0"
          aria-label={`Add ${exercise.name}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
