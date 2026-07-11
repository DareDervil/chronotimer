'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Timer } from 'lucide-react'
import type { BlockType } from '@/types/database'
import type { BuilderBlock, BuilderBlockExercise } from '@/types/builder'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlockConfigDialog } from './block-config-dialog'
import { ExerciseConfigDialog } from './exercise-config-dialog'
import { cn } from '@/lib/utils'

const BLOCK_LABELS: Record<BlockType, string> = {
  hiit: 'HIIT',
  tabata: 'Tabata',
  amrap: 'AMRAP',
  emom: 'EMOM',
  circuit: 'Circuit',
  straight_sets: 'Straight Sets',
  free: 'Free-form',
  rest: 'Rest',
}

function blockSummary(block: BuilderBlock): string {
  const c = block.config
  switch (block.block_type) {
    case 'hiit':
    case 'tabata':
      return [c.work_s && `${c.work_s}s on`, c.rest_s && `${c.rest_s}s off`, c.rounds && `× ${c.rounds}`]
        .filter(Boolean).join(' · ')
    case 'amrap':
      return c.total_duration_s ? `${Math.round(c.total_duration_s / 60)} min` : ''
    case 'emom':
      return c.interval_s ? `${c.interval_s}s interval` : ''
    case 'circuit':
      return [c.rounds && `${c.rounds} rounds`, c.rest_between_exercises_s && `${c.rest_between_exercises_s}s rest`]
        .filter(Boolean).join(' · ')
    case 'straight_sets':
      return [c.sets && `${c.sets} sets`, c.rest_between_sets_s && `${c.rest_between_sets_s}s rest`]
        .filter(Boolean).join(' · ')
    case 'free':
      if (c.mode === 'reps') return c.reps ? `${c.reps} reps/ex` : 'Per exercise · reps'
      return c.work_s ? `${c.work_s}s/ex` : 'Per exercise · timed'
    case 'rest':
      return c.rest_s ? `${c.rest_s}s` : ''
  }
}

interface BlockCardProps {
  block: BuilderBlock
  onUpdateConfig: (block_type: BuilderBlock['block_type'], config: BuilderBlock['config']) => void
  onRemoveExercise: (bexId: string) => void
  onRemoveBlock: () => void
  onUpdateExercise: (bexId: string, updates: Partial<BuilderBlockExercise>) => void
  onMobileAdd?: () => void
}

export function BlockCard({ block, onUpdateConfig, onRemoveExercise, onRemoveBlock, onUpdateExercise, onMobileAdd }: BlockCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `block:${block.id}` })
  const exerciseIds = block.exercises.map((e) => `bex:${e.id}`)

  return (
    <div
      className={cn(
        'rounded-lg border bg-card transition-colors',
        isOver && 'border-foreground/40 bg-foreground/5'
      )}
    >
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <Badge variant="outline" className="text-xs font-medium shrink-0">
          {BLOCK_LABELS[block.block_type]}
        </Badge>
        <span className="text-xs text-muted-foreground flex-1 truncate">{blockSummary(block)}</span>
        <BlockConfigDialog block={block} onSave={onUpdateConfig} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemoveBlock}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Exercises */}
      <div ref={setNodeRef} className="p-2 min-h-[60px]">
        <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
          {block.exercises.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-3">
              <span className="hidden md:block">Drag exercises here</span>
              {onMobileAdd ? (
                <button
                  type="button"
                  onClick={onMobileAdd}
                  className="md:hidden text-primary font-medium"
                >
                  + Add exercise
                </button>
              ) : (
                <span className="md:hidden">Drag exercises here</span>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {block.exercises.map((bex) => (
                  <SortableExerciseItem
                    key={bex.id}
                    bex={bex}
                    blockType={block.block_type}
                    isGlobalDuration={
                      (block.block_type === 'circuit' && !!block.config.work_s) ||
                      (block.block_type === 'free' && block.config.mode === 'time' && !!block.config.work_s) ||
                      (block.block_type === 'free' && block.config.mode === 'reps' && !!block.config.reps)
                    }
                    freeMode={block.block_type === 'free' ? (block.config.mode ?? 'time') : undefined}
                    onRemove={() => onRemoveExercise(bex.id)}
                    onUpdateExercise={(updates) => onUpdateExercise(bex.id, updates)}
                  />
                ))}
              </div>
              {onMobileAdd && (
                <button
                  type="button"
                  onClick={onMobileAdd}
                  className="md:hidden mt-1.5 w-full text-xs text-muted-foreground hover:text-primary py-1.5 border border-dashed border-border rounded-md transition-colors"
                >
                  + Add exercise
                </button>
              )}
            </>
          )}
        </SortableContext>
      </div>
    </div>
  )
}

const EXERCISE_CONFIG_TYPES: BlockType[] = ['circuit', 'straight_sets', 'free']

function SortableExerciseItem({
  bex,
  blockType,
  isGlobalDuration,
  freeMode,
  onRemove,
  onUpdateExercise,
}: {
  bex: BuilderBlockExercise
  blockType: BlockType
  isGlobalDuration: boolean
  freeMode?: 'time' | 'reps'
  onRemove: () => void
  onUpdateExercise: (updates: Partial<BuilderBlockExercise>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `bex:${bex.id}`,
    data: { type: 'bex', bex },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm',
        isDragging && 'opacity-40'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing hidden md:flex"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 truncate text-sm">{bex.exercise.name}</span>
      {bex.duration_s && (
        <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
          <Timer className="h-3 w-3" />
          {bex.duration_s}s
        </span>
      )}
      {bex.reps && (
        <span className="text-xs text-muted-foreground shrink-0">{bex.reps} reps</span>
      )}
      {bex.sets && (
        <span className="text-xs text-muted-foreground shrink-0">{bex.sets} sets</span>
      )}
      {EXERCISE_CONFIG_TYPES.includes(blockType) && (
        <ExerciseConfigDialog bex={bex} blockType={blockType} isGlobalDuration={isGlobalDuration} freeMode={freeMode} onSave={onUpdateExercise} />
      )}
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
