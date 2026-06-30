'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Exercise, ExerciseCategory } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ExerciseDetailSheet } from './exercise-detail-sheet'
import { CreateExerciseDialog } from './create-exercise-dialog'
import { deleteCustomExercise } from '@/lib/actions/exercises'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  warmup: 'Warm-up',
  cardio: 'Cardio',
  strength: 'Strength',
  mobility: 'Mobility',
}

// Friendly display labels for wger equipment names
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

interface ExerciseLibraryProps {
  exercises: Exercise[]
  userId: string
}

export function ExerciseLibrary({ exercises, userId }: ExerciseLibraryProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [equipFilter, setEquipFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ExerciseCategory | 'custom' | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null)

  const customExercises = useMemo(
    () => exercises.filter((ex) => ex.is_custom && ex.created_by === userId),
    [exercises, userId]
  )

  // Collect all distinct equipment types across all exercises
  const allEquipment = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) {
      for (const eq of ex.equipment) set.add(eq)
    }
    // No equipment = bodyweight
    set.add('none (bodyweight exercise)')
    return Array.from(set).sort((a, b) => {
      // Put bodyweight first
      if (a === 'none (bodyweight exercise)') return -1
      if (b === 'none (bodyweight exercise)') return 1
      return a.localeCompare(b)
    })
  }, [exercises])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return exercises.filter((ex) => {
      // Custom exercises only appear in the Custom tab
      if (ex.is_custom) return false
      if (equipFilter) {
        const eq = ex.equipment
        if (equipFilter === 'none (bodyweight exercise)') {
          if (eq.length > 0 && !eq.includes('none (bodyweight exercise)')) return false
        } else {
          if (!eq.includes(equipFilter)) return false
        }
      }
      if (!q) return true
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.description?.toLowerCase().includes(q)
      )
    })
  }, [exercises, search, equipFilter])

  const byCategory = useMemo(() => {
    const map: Partial<Record<ExerciseCategory, Exercise[]>> = {}
    for (const ex of filtered) {
      if (!map[ex.category]) map[ex.category] = []
      map[ex.category]!.push(ex)
    }
    return map
  }, [filtered])

  const categories = (['warmup', 'cardio', 'strength', 'mobility'] as ExerciseCategory[]).filter(
    (c) => byCategory[c]?.length
  )

  // Keep active tab valid when categories change (e.g. after equipment filter)
  const effectiveTab = (activeTab && (categories.includes(activeTab as ExerciseCategory) || activeTab === 'custom')
    ? activeTab
    : categories[0]) ?? 'strength'

  async function confirmDelete() {
    if (!exerciseToDelete) return
    try {
      await deleteCustomExercise(exerciseToDelete.id)
      if (selected?.id === exerciseToDelete.id) setSelected(null)
      toast.success('Exercise deleted')
    } catch {
      toast.error('Failed to delete exercise')
    } finally {
      setExerciseToDelete(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search + New exercise */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New exercise
          </button>
        </div>

        {/* Equipment filter — hidden on custom tab */}
        {effectiveTab !== 'custom' && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEquipFilter(null)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
                  'text-xs px-3 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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

        <Tabs value={effectiveTab} onValueChange={(v) => setActiveTab(v as ExerciseCategory | 'custom')} className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 mb-4">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_LABELS[cat]} ({byCategory[cat]!.length})
              </TabsTrigger>
            ))}
            <TabsTrigger value="custom">
              Custom {customExercises.length > 0 && `(${customExercises.length})`}
            </TabsTrigger>
          </TabsList>

          {filtered.length === 0 && effectiveTab !== 'custom' ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No exercises match your search.</p>
          ) : null}

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(byCategory[cat] ?? []).map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => setSelected(exercise)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="custom">
            {customExercises.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center gap-3">
                <p className="font-medium">No custom exercises yet</p>
                <p className="text-sm text-muted-foreground">Use the "New exercise" button above to create one</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => setSelected(exercise)}
                    onDelete={() => setExerciseToDelete(exercise)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ExerciseDetailSheet exercise={selected} onClose={() => setSelected(null)} />
      <CreateExerciseDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={!!exerciseToDelete} onOpenChange={(o) => { if (!o) setExerciseToDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete exercise?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &quot;{exerciseToDelete?.name}&quot; will be permanently deleted.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExerciseToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ExerciseCard({
  exercise,
  onClick,
  onDelete,
}: {
  exercise: Exercise
  onClick?: () => void
  onDelete?: () => void
}) {
  const equipLabel = exercise.equipment
    .filter((e) => e !== 'none (bodyweight exercise)')
    .map((e) => EQUIPMENT_LABELS[e] ?? e)
    .slice(0, 2)

  return (
    <Card
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      className={cn(onClick && 'cursor-pointer hover:border-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', 'relative')}
    >
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Delete exercise"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold pr-6">{exercise.name}</CardTitle>
        {exercise.description && (
          <CardDescription className="text-xs line-clamp-2">{exercise.description}</CardDescription>
        )}
        {!exercise.description && exercise.instructions && (
          <CardDescription className="text-xs line-clamp-2">{exercise.instructions}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          {equipLabel.length === 0 ? (
            <Badge variant="outline" className="text-xs font-normal">Bodyweight</Badge>
          ) : (
            equipLabel.map((eq) => (
              <Badge key={eq} variant="outline" className="text-xs font-normal">{eq}</Badge>
            ))
          )}
          {exercise.primary_muscles.slice(0, 2).map((m) => (
            <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-medium">
              {m.split(' ')[0]}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
