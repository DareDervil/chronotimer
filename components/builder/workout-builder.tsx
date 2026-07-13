'use client'

import { useState, useCallback, useTransition, useEffect, useRef } from 'react'
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
import { Plus, Save, Trash2, ChevronRight, Play, X } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { toast } from 'sonner'
import type { BlockConfig, BlockType, Exercise, PhaseType } from '@/types/database'
import type { BuilderBlock, BuilderBlockExercise, BuilderPhase, BuilderWorkout } from '@/types/builder'
import type { WorkoutWithStructure } from '@/types/database'
import { createWorkout, deleteWorkout, updateWorkout } from '@/lib/actions/workouts'
import { createBlockExercise } from '@/lib/builder/block-exercise'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { ExerciseSidebar } from './exercise-sidebar'
import { BlockCard } from './block-card'
import { ShareDialog } from './share-dialog'
import { WorkoutTimeline } from './workout-timeline'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

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

function initPhases(workout?: WorkoutWithStructure): BuilderPhase[] {
  if (!workout) {
    return PHASE_ORDER.map((pt) => ({ id: uid(), phase_type: pt, blocks: [] }))
  }
  // Hydrate from saved workout — preserve IDs
  const phaseMap = new Map(workout.phases.map((p) => [p.phase_type, p]))
  return PHASE_ORDER.map((pt) => {
    const p = phaseMap.get(pt)
    if (!p) return { id: uid(), phase_type: pt, blocks: [] }
    return {
      id: p.id,
      phase_type: p.phase_type,
      blocks: p.blocks.map((b) => ({
        id: b.id,
        block_type: b.block_type,
        config: b.config,
        exercises: b.exercises.map((bex) => ({
          id: bex.id,
          exercise_id: bex.exercise_id,
          exercise: bex.exercise!,
          duration_s: bex.duration_s,
          reps: bex.reps,
          sets: bex.sets,
          rest_after_s: bex.rest_after_s,
        })),
      })),
    }
  })
}

// Convert builder state → WorkoutWithStructure shape for the timer (guest mode)
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

// ─── Component ────────────────────────────────────────────────────────────────

interface WorkoutBuilderProps {
  exercises: Exercise[]
  initialWorkout?: WorkoutWithStructure
  guestMode?: boolean
}

type ActiveDragItem = { type: 'bex'; bex: BuilderBlockExercise }

export function WorkoutBuilder({ exercises, initialWorkout, guestMode = false }: WorkoutBuilderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [workout, setWorkout] = useState<BuilderWorkout>({
    name: initialWorkout?.name ?? '',
    description: initialWorkout?.description ?? '',
    phases: initPhases(initialWorkout),
  })
  const [isDirty, setIsDirty] = useState(false)
  const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addTargetBlockId, setAddTargetBlockId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  // Unsaved changes guard (auth only)
  useEffect(() => {
    if (guestMode || !isDirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, guestMode])

  // Cmd+S shortcut (auth only) — ref keeps listener stable across renders
  const handleSaveRef = useRef<() => void>(() => {})
  useEffect(() => {
    handleSaveRef.current = () => handleSave(false)
  })
  useEffect(() => {
    if (guestMode) return
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestMode])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function findBlockById(blockId: string): BuilderBlock | undefined {
    for (const phase of workout.phases) {
      const block = phase.blocks.find((b) => b.id === blockId)
      if (block) return block
    }
  }

  function findBlockIdByBexId(bexId: string): string | null {
    for (const phase of workout.phases) {
      for (const block of phase.blocks) {
        if (block.exercises.some((e) => e.id === bexId)) return block.id
      }
    }
    return null
  }

  function updatePhases(updater: (phases: BuilderPhase[]) => BuilderPhase[]) {
    setIsDirty(true)
    setWorkout((w) => ({ ...w, phases: updater(w.phases) }))
  }

  // ── Block mutations ──────────────────────────────────────────────────────────

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

  // ── Exercise mutations ────────────────────────────────────────────────────────

  const addExerciseToBlock = useCallback((blockId: string, exercise: Exercise) => {
    const newBex = createBlockExercise(exercise, uid())
    updatePhases((phases) =>
      phases.map((p) => ({
        ...p,
        blocks: p.blocks.map((b) =>
          b.id === blockId ? { ...b, exercises: [...b.exercises, newBex] } : b
        ),
      }))
    )
  }, [])

  const addExercisesToBlock = useCallback((blockId: string, exercisesToAdd: Exercise[]) => {
    const newBexs = exercisesToAdd.map((exercise) => createBlockExercise(exercise, uid()))
    updatePhases((phases) =>
      phases.map((p) => ({
        ...p,
        blocks: p.blocks.map((b) =>
          b.id === blockId ? { ...b, exercises: [...b.exercises, ...newBexs] } : b
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
        // Remove from source
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
        // Insert into target
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

  // ── DnD handlers ─────────────────────────────────────────────────────────────

  function onDragStart({ active }: DragStartEvent) {
    const data = active.data.current
    if (!data) return
    if (data.type === 'bex') {
      setActiveItem({ type: 'bex', bex: data.bex })
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId.startsWith('bex:')) {
      const activeBexId = activeId.slice('bex:'.length)
      const activeBlockId = findBlockIdByBexId(activeBexId)
      if (!activeBlockId) return

      if (overId.startsWith('bex:')) {
        const overBexId = overId.slice('bex:'.length)
        const overBlockId = findBlockIdByBexId(overBexId)
        if (!overBlockId) return

        if (activeBlockId === overBlockId) {
          reorderExercisesInBlock(activeBlockId, activeBexId, overBexId)
        } else if (findBlockById(overBlockId)?.block_type !== 'rest') {
          moveExerciseBetweenBlocks(activeBexId, activeBlockId, overBlockId, overBexId)
        }
      } else if (overId.startsWith('block:')) {
        const overBlockId = overId.slice('block:'.length)
        if (activeBlockId !== overBlockId && findBlockById(overBlockId)?.block_type !== 'rest') {
          moveExerciseBetweenBlocks(activeBexId, activeBlockId, overBlockId)
        }
      }
    }
  }

  // ── Save / Delete (auth) ─────────────────────────────────────────────────────

  function handleSave(andStart = false) {
    if (!workout.name.trim()) {
      toast.error('Please enter a workout name')
      return
    }
    const input = { name: workout.name, description: workout.description, phases: workout.phases }
    startTransition(async () => {
      try {
        if (initialWorkout) {
          await updateWorkout(initialWorkout.id, input)
          setIsDirty(false)
          toast.success('Workout saved')
          router.push(andStart ? `/workouts/${initialWorkout.id}/run` : '/workouts')
        } else {
          const { id } = await createWorkout(input)
          setIsDirty(false)
          toast.success('Workout saved')
          router.push(andStart ? `/workouts/${id}/run` : '/workouts')
        }
      } catch {
        toast.error('Failed to save workout')
      }
    })
  }

  function handleDelete() {
    if (!initialWorkout) return
    startTransition(async () => {
      try {
        await deleteWorkout(initialWorkout.id)
        router.push('/workouts')
      } catch {
        toast.error('Failed to delete workout')
      }
    })
  }

  // ── Run (guest) ───────────────────────────────────────────────────────────────

  function handleRun() {
    const hasBlocks = workout.phases.some((p) => p.blocks.length > 0)
    if (!hasBlocks) return
    const payload = buildWorkoutPayload(workout)
    try {
      sessionStorage.setItem('chronicon:guest-workout', JSON.stringify(payload))
    } catch { /* storage unavailable */ }
    router.push('/try/run')
  }

  // ── Exercise picker ─────────────────────────────────────────────────────────

  function openPickerForBlock(blockId: string) {
    setAddTargetBlockId(blockId)
    setPickerOpen(true)
  }

  function handleAddExercise(exercise: Exercise) {
    if (!addTargetBlockId) return
    addExerciseToBlock(addTargetBlockId, exercise)
    setPickerOpen(false)
  }

  function handleAddManyExercises(exercisesToAdd: Exercise[]) {
    if (!addTargetBlockId) return
    addExercisesToBlock(addTargetBlockId, exercisesToAdd)
    setPickerOpen(false)
  }

  const hasBlocks = workout.phases.some((p) => p.blocks.length > 0)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (<>
    <DndContext id="workout-builder" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={cn('flex flex-col', guestMode ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-screen')}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
          <Input
            value={workout.name}
            onChange={(e) => { setIsDirty(true); setWorkout((w) => ({ ...w, name: e.target.value })) }}
            placeholder="Workout name…"
            className="text-base font-medium border-0 shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent flex-1"
          />
          {guestMode ? (
            <Button onClick={handleRun} disabled={!hasBlocks} size="sm" className="shrink-0">
              <Play className="h-4 w-4 mr-1.5" />
              Run Workout
            </Button>
          ) : (
            <>
              {initialWorkout && (
                <ShareDialog
                  workoutId={initialWorkout.id}
                  initialIsPublic={initialWorkout.is_public}
                  initialSlug={initialWorkout.share_slug}
                />
              )}
              {initialWorkout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={() => handleSave(false)} disabled={isPending} size="sm" variant="outline" className="shrink-0">
                <Save className="h-4 w-4 mr-1.5" />
                {isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isPending} size="sm" className="shrink-0">
                <Play className="h-4 w-4 mr-1.5" />
                Save & Start
              </Button>
            </>
          )}
        </div>

        {/* Body: canvas */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas + timeline */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Workout canvas */}
            <main className="flex-1 overflow-y-auto p-6 md:pb-6" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              {/* Optional description */}
              <div className="mb-6 max-w-3xl mx-auto">
                <Input
                  value={workout.description}
                  onChange={(e) => { setIsDirty(true); setWorkout((w) => ({ ...w, description: e.target.value })) }}
                  placeholder="Description (optional)"
                  className="text-sm text-muted-foreground border-0 shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div className="space-y-6 max-w-3xl mx-auto">
                {workout.phases.map((phase) => (
                  <PhaseSection
                    key={phase.id}
                    phase={phase}
                    onAddBlock={() => addBlock(phase.id)}
                    onRemoveBlock={(blockId) => removeBlock(phase.id, blockId)}
                    onUpdateBlockConfig={updateBlockConfig}
                    onRemoveExercise={removeExerciseFromBlock}
                    onUpdateExercise={updateExerciseConfig}
                    onAddExercise={openPickerForBlock}
                  />
                ))}
              </div>
            </main>

            {/* Timeline — desktop only */}
            <div className="hidden md:block">
              <WorkoutTimeline phases={workout.phases} />
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem?.type === 'bex' && (
          <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-lg opacity-90">
            {activeItem.bex.exercise.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>

    {/* Exercise picker — vaul Drawer outside DndContext for reliable cross-browser scroll */}
    <Drawer.Root open={pickerOpen} onOpenChange={setPickerOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Drawer.Content
          className="fixed bottom-0 inset-x-0 z-50 flex flex-col bg-popover rounded-t-2xl border-t border-border focus:outline-none"
          style={{ height: '75dvh' }}
        >
          <Drawer.Title className="sr-only">Add exercise</Drawer.Title>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <span className="font-semibold text-sm">Add exercise</span>
            <button
              onClick={() => setPickerOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ExerciseSidebar exercises={exercises} onTapAdd={handleAddExercise} onAddMany={handleAddManyExercises} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  </>)
}

// ─── PhaseSection ──────────────────────────────────────────────────────────────

interface PhaseSectionProps {
  phase: BuilderPhase
  onAddBlock: () => void
  onRemoveBlock: (blockId: string) => void
  onUpdateBlockConfig: (blockId: string, block_type: BlockType, config: BlockConfig) => void
  onRemoveExercise: (bexId: string) => void
  onUpdateExercise: (bexId: string, updates: Partial<BuilderBlockExercise>) => void
  onAddExercise: (blockId: string) => void
}

function PhaseSection({ phase, onAddBlock, onRemoveBlock, onUpdateBlockConfig, onRemoveExercise, onUpdateExercise, onAddExercise }: PhaseSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      {/* Phase header */}
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
              onAddExercise={() => onAddExercise(block.id)}
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
