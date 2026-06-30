'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, Play, ChevronRight } from 'lucide-react'
import type { BlockConfig, BlockType, Exercise, PhaseType } from '@/types/database'
import type { BuilderBlock, BuilderBlockExercise, BuilderPhase, BuilderWorkout } from '@/types/builder'
import type { WorkoutWithStructure } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ExerciseSidebar } from './exercise-sidebar'
import { BlockCard } from './block-card'
import { WorkoutTimeline } from './workout-timeline'
import { cn } from '@/lib/utils'

const PHASE_LABELS: Record<PhaseType, string> = {
  warmup: 'Warm-Up',
  main: 'Main',
  cooldown: 'Cool-Down',
}

const PHASE_ORDER: PhaseType[] = ['warmup', 'main', 'cooldown']

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts (local network testing over HTTP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function defaultBlock(): BuilderBlock {
  return {
    id: uid(),
    block_type: 'circuit',
    config: { rounds: 3, rest_between_exercises_s: 30, rest_between_rounds_s: 60 },
    exercises: [],
  }
}

function initPhases(): BuilderPhase[] {
  return PHASE_ORDER.map((pt) => ({ id: uid(), phase_type: pt, blocks: [] }))
}

// Convert builder state → WorkoutWithStructure shape for the timer
function buildWorkoutPayload(workout: BuilderWorkout): WorkoutWithStructure {
  const now = new Date().toISOString()
  const fakeId = uid()
  return {
    id: fakeId,
    user_id: 'guest',
    name: workout.name || 'My Workout',
    description: workout.description || null,
    is_public: false,
    share_slug: null,
    created_at: now,
    updated_at: now,
    phases: workout.phases
      .filter((p) => p.blocks.length > 0)
      .map((p, pi) => ({
        id: p.id,
        workout_id: fakeId,
        phase_type: p.phase_type,
        order_index: pi,
        blocks: p.blocks.map((b, bi) => ({
          id: b.id,
          phase_id: p.id,
          block_type: b.block_type,
          config: b.config,
          order_index: bi,
          exercises: b.exercises.map((e, ei) => ({
            id: e.id,
            block_id: b.id,
            exercise_id: e.exercise_id,
            duration_s: e.duration_s,
            reps: e.reps,
            sets: e.sets,
            rest_after_s: e.rest_after_s,
            order_index: ei,
            exercise: e.exercise,
          })),
        })),
      })),
  }
}

type ActiveDragItem =
  | { type: 'sidebar'; exercise: Exercise }
  | { type: 'bex'; bex: BuilderBlockExercise }

interface GuestWorkoutBuilderProps {
  exercises: Exercise[]
}

export function GuestWorkoutBuilder({ exercises }: GuestWorkoutBuilderProps) {
  const router = useRouter()

  const [workout, setWorkout] = useState<BuilderWorkout>({
    name: '',
    description: '',
    phases: initPhases(),
  })
  const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [mobileAddTarget, setMobileAddTarget] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function updatePhases(updater: (phases: BuilderPhase[]) => BuilderPhase[]) {
    setWorkout((w) => ({ ...w, phases: updater(w.phases) }))
  }

  function findBlockIdByBexId(bexId: string): string | null {
    for (const phase of workout.phases) {
      for (const block of phase.blocks) {
        if (block.exercises.some((e) => e.id === bexId)) return block.id
      }
    }
    return null
  }

  const addBlock = useCallback((phaseId: string) => {
    updatePhases((phases) =>
      phases.map((p) =>
        p.id === phaseId ? { ...p, blocks: [...p.blocks, defaultBlock()] } : p
      )
    )
  }, [])

  const removeBlock = useCallback((phaseId: string, blockId: string) => {
    updatePhases((phases) =>
      phases.map((p) =>
        p.id === phaseId ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) } : p
      )
    )
  }, [])

  const updateBlockConfig = useCallback((blockId: string, block_type: BlockType, config: BlockConfig) => {
    updatePhases((phases) =>
      phases.map((p) => ({
        ...p,
        blocks: p.blocks.map((b) =>
          b.id === blockId ? { ...b, block_type, config } : b
        ),
      }))
    )
  }, [])

  const updateExerciseConfig = useCallback((bexId: string, updates: Partial<BuilderBlockExercise>) => {
    updatePhases((phases) =>
      phases.map((p) => ({
        ...p,
        blocks: p.blocks.map((b) => ({
          ...b,
          exercises: b.exercises.map((e) => e.id === bexId ? { ...e, ...updates } : e),
        })),
      }))
    )
  }, [])

  const addExerciseToBlock = useCallback((blockId: string, exercise: Exercise) => {
    const newBex: BuilderBlockExercise = {
      id: uid(),
      exercise_id: exercise.id,
      exercise,
      duration_s: null,
      reps: null,
      sets: null,
      rest_after_s: 0,
    }
    updatePhases((phases) =>
      phases.map((p) => ({
        ...p,
        blocks: p.blocks.map((b) =>
          b.id === blockId ? { ...b, exercises: [...b.exercises, newBex] } : b
        ),
      }))
    )
  }, [])

  const removeExerciseFromBlock = useCallback((bexId: string) => {
    updatePhases((phases) =>
      phases.map((p) => ({
        ...p,
        blocks: p.blocks.map((b) => ({
          ...b,
          exercises: b.exercises.filter((e) => e.id !== bexId),
        })),
      }))
    )
  }, [])

  const reorderExercisesInBlock = useCallback((blockId: string, fromBexId: string, toBexId: string) => {
    updatePhases((phases) =>
      phases.map((p) => ({
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== blockId) return b
          const fromIdx = b.exercises.findIndex((e) => e.id === fromBexId)
          const toIdx = b.exercises.findIndex((e) => e.id === toBexId)
          if (fromIdx === -1 || toIdx === -1) return b
          return { ...b, exercises: arrayMove(b.exercises, fromIdx, toIdx) }
        }),
      }))
    )
  }, [])

  const moveExerciseBetweenBlocks = useCallback(
    (bexId: string, fromBlockId: string, toBlockId: string, beforeBexId?: string | null) => {
      updatePhases((phases) => {
        let movingItem: BuilderBlockExercise | undefined
        const afterRemove = phases.map((p) => ({
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== fromBlockId) return b
            movingItem = b.exercises.find((e) => e.id === bexId)
            return { ...b, exercises: b.exercises.filter((e) => e.id !== bexId) }
          }),
        }))
        if (!movingItem) return phases
        const item = movingItem
        return afterRemove.map((p) => ({
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== toBlockId) return b
            if (!beforeBexId) return { ...b, exercises: [...b.exercises, item] }
            const idx = b.exercises.findIndex((e) => e.id === beforeBexId)
            const newExercises = [...b.exercises]
            newExercises.splice(idx === -1 ? newExercises.length : idx, 0, item)
            return { ...b, exercises: newExercises }
          }),
        }))
      })
    },
    []
  )

  function onDragStart({ active }: DragStartEvent) {
    const data = active.data.current
    if (!data) return
    if (data.type === 'sidebar') setActiveItem({ type: 'sidebar', exercise: data.exercise })
    else if (data.type === 'bex') setActiveItem({ type: 'bex', bex: data.bex })
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null)
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    if (activeId.startsWith('sidebar:')) {
      const exercise: Exercise = active.data.current?.exercise
      if (!exercise) return
      let targetBlockId: string | null = null
      if (overId.startsWith('block:')) targetBlockId = overId.slice('block:'.length)
      else if (overId.startsWith('bex:')) targetBlockId = findBlockIdByBexId(overId.slice('bex:'.length))
      if (targetBlockId) addExerciseToBlock(targetBlockId, exercise)
    } else if (activeId.startsWith('bex:')) {
      const activeBexId = activeId.slice('bex:'.length)
      const activeBlockId = findBlockIdByBexId(activeBexId)
      if (!activeBlockId) return
      if (overId.startsWith('bex:')) {
        const overBexId = overId.slice('bex:'.length)
        const overBlockId = findBlockIdByBexId(overBexId)
        if (!overBlockId) return
        if (activeBlockId === overBlockId) reorderExercisesInBlock(activeBlockId, activeBexId, overBexId)
        else moveExerciseBetweenBlocks(activeBexId, activeBlockId, overBlockId, overBexId)
      } else if (overId.startsWith('block:')) {
        const overBlockId = overId.slice('block:'.length)
        if (activeBlockId !== overBlockId) moveExerciseBetweenBlocks(activeBexId, activeBlockId, overBlockId)
      }
    }
  }

  function handleRun() {
    const hasBlocks = workout.phases.some((p) => p.blocks.length > 0)
    if (!hasBlocks) return
    const payload = buildWorkoutPayload(workout)
    try {
      sessionStorage.setItem('chronicon:guest-workout', JSON.stringify(payload))
    } catch { /* storage unavailable */ }
    router.push('/try/run')
  }

  function handleMobileAdd(blockId: string) {
    setMobileAddTarget(blockId)
    setMobileSheetOpen(true)
  }

  function handleMobileTapAdd(exercise: Exercise) {
    if (!mobileAddTarget) return
    addExerciseToBlock(mobileAddTarget, exercise)
    setMobileSheetOpen(false)
  }

  const hasBlocks = workout.phases.some((p) => p.blocks.length > 0)

  return (<>
    <DndContext
      id="guest-workout-builder"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
          <Input
            value={workout.name}
            onChange={(e) => setWorkout((w) => ({ ...w, name: e.target.value }))}
            placeholder="Workout name…"
            className="text-base font-medium border-0 shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent flex-1"
          />
          <Button
            onClick={handleRun}
            disabled={!hasBlocks}
            size="sm"
            className="shrink-0"
          >
            <Play className="h-4 w-4 mr-1.5" />
            Run Workout
          </Button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Exercise sidebar — desktop */}
          <aside className="w-72 shrink-0 border-r overflow-y-auto hidden md:block">
            <ExerciseSidebar exercises={exercises} />
          </aside>

          <div className="flex flex-col flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 max-w-3xl mx-auto">
                <Input
                  value={workout.description}
                  onChange={(e) => setWorkout((w) => ({ ...w, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className="text-sm text-muted-foreground border-0 shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div className="space-y-6 max-w-3xl mx-auto">
                {workout.phases.map((phase) => (
                  <GuestPhaseSection
                    key={phase.id}
                    phase={phase}
                    onAddBlock={() => addBlock(phase.id)}
                    onRemoveBlock={(blockId) => removeBlock(phase.id, blockId)}
                    onUpdateBlockConfig={updateBlockConfig}
                    onRemoveExercise={removeExerciseFromBlock}
                    onUpdateExercise={updateExerciseConfig}
                    onMobileAdd={handleMobileAdd}
                  />
                ))}
              </div>
            </main>

            <div className="hidden md:block">
              <WorkoutTimeline phases={workout.phases} />
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem?.type === 'sidebar' && (
          <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-lg font-medium opacity-90">
            {activeItem.exercise.name}
          </div>
        )}
        {activeItem?.type === 'bex' && (
          <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-lg opacity-90">
            {activeItem.bex.exercise.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>

    {/* Mobile exercise picker — outside DndContext so TouchSensor cannot intercept scroll/taps */}
    <DndContext id="guest-mobile-sheet">
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[75vh] p-0 gap-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
            <SheetTitle>Add exercise</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            <ExerciseSidebar exercises={exercises} onTapAdd={handleMobileTapAdd} />
          </div>
        </SheetContent>
      </Sheet>
    </DndContext>
  </>)
}

// ── Phase section (same as auth builder) ─────────────────────────────────────

interface GuestPhaseSectionProps {
  phase: BuilderPhase
  onAddBlock: () => void
  onRemoveBlock: (blockId: string) => void
  onUpdateBlockConfig: (blockId: string, block_type: BlockType, config: BlockConfig) => void
  onRemoveExercise: (bexId: string) => void
  onUpdateExercise: (bexId: string, updates: Partial<BuilderBlockExercise>) => void
  onMobileAdd: (blockId: string) => void
}

function GuestPhaseSection({
  phase,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlockConfig,
  onRemoveExercise,
  onUpdateExercise,
  onMobileAdd,
}: GuestPhaseSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-1.5 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', !collapsed && 'rotate-90')} />
        {PHASE_LABELS[phase.phase_type]}
        <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground/60">
          ({phase.blocks.length} {phase.blocks.length === 1 ? 'block' : 'blocks'})
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {phase.blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onUpdateConfig={(type, config) => onUpdateBlockConfig(block.id, type, config)}
              onRemoveExercise={onRemoveExercise}
              onRemoveBlock={() => onRemoveBlock(block.id)}
              onUpdateExercise={onUpdateExercise}
              onMobileAdd={() => onMobileAdd(block.id)}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onAddBlock}
            className="w-full border-dashed text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add block
          </Button>
        </div>
      )}
    </div>
  )
}
