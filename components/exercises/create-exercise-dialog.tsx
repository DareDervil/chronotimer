'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createCustomExercise } from '@/lib/actions/exercises'
import type { ExerciseCategory, WgerMuscle } from '@/types/database'

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'warmup', label: 'Warm-up' },
  { value: 'mobility', label: 'Mobility' },
]

const MUSCLES: { value: WgerMuscle; label: string }[] = [
  { value: 'Anterior deltoid', label: 'Shoulders' },
  { value: 'Biceps brachii', label: 'Biceps' },
  { value: 'Biceps femoris', label: 'Hamstrings' },
  { value: 'Brachialis', label: 'Upper Arm' },
  { value: 'Gastrocnemius', label: 'Calves' },
  { value: 'Gluteus maximus', label: 'Glutes' },
  { value: 'Latissimus dorsi', label: 'Lats' },
  { value: 'Obliquus externus abdominis', label: 'Obliques' },
  { value: 'Pectoralis major', label: 'Chest' },
  { value: 'Quadriceps femoris', label: 'Quads' },
  { value: 'Rectus abdominis', label: 'Abs' },
  { value: 'Serratus anterior', label: 'Serratus' },
  { value: 'Soleus', label: 'Calves (deep)' },
  { value: 'Trapezius', label: 'Traps' },
  { value: 'Triceps brachii', label: 'Triceps' },
]

const EQUIPMENT_OPTIONS = [
  'none (bodyweight exercise)',
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Pull-up bar',
  'Bench',
  'Incline bench',
  'Swiss Ball',
  'Gym mat',
  'Resistance band',
  'SZ-Bar',
]

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

interface CreateExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateExerciseDialog({ open, onOpenChange }: CreateExerciseDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('strength')
  const [instructions, setInstructions] = useState('')
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([])
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([])
  const [equipment, setEquipment] = useState<string[]>([])
  const [pending, setPending] = useState(false)

  function toggleMuscle(muscle: string, type: 'primary' | 'secondary') {
    if (type === 'primary') {
      setPrimaryMuscles((prev) =>
        prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
      )
      // Remove from secondary if being added to primary
      setSecondaryMuscles((prev) => prev.filter((m) => m !== muscle))
    } else {
      setSecondaryMuscles((prev) =>
        prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
      )
      // Remove from primary if being added to secondary
      setPrimaryMuscles((prev) => prev.filter((m) => m !== muscle))
    }
  }

  function toggleEquipment(eq: string) {
    setEquipment((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq])
  }

  function reset() {
    setName('')
    setCategory('strength')
    setInstructions('')
    setPrimaryMuscles([])
    setSecondaryMuscles([])
    setEquipment([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !instructions.trim()) return
    setPending(true)
    try {
      await createCustomExercise({
        name,
        category,
        instructions,
        primary_muscles: primaryMuscles,
        secondary_muscles: secondaryMuscles,
        equipment,
      })
      toast.success('Exercise created')
      reset()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create exercise')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New custom exercise</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="ex-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Banded hip thrust"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category <span className="text-destructive">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'text-sm px-3 py-1.5 rounded-md border transition-colors',
                    category === c.value
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-instructions">How to perform <span className="text-destructive">*</span></Label>
            <textarea
              id="ex-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe the movement, form cues, common mistakes..."
              rows={4}
              required
              style={{ fontSize: '16px' }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Muscles */}
          <div className="space-y-2">
            <Label>Muscles <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLES.map((m) => {
                const isPrimary = primaryMuscles.includes(m.value)
                const isSecondary = secondaryMuscles.includes(m.value)
                return (
                  <div key={m.value} className="flex rounded-full overflow-hidden border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => toggleMuscle(m.value, 'primary')}
                      className={cn(
                        'px-2.5 py-1 transition-colors',
                        isPrimary
                          ? 'bg-orange-500 text-white border-r border-orange-400'
                          : 'text-muted-foreground hover:bg-muted border-r border-border'
                      )}
                      title="Primary"
                    >
                      {m.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleMuscle(m.value, 'secondary')}
                      className={cn(
                        'px-1.5 py-1 transition-colors',
                        isSecondary
                          ? 'bg-amber-400 text-white'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                      title="Secondary"
                    >
                      {isPrimary || isSecondary ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">Click the name to mark as primary (orange), the +/× to toggle secondary (amber)</p>
          </div>

          {/* Equipment */}
          <div className="space-y-1.5">
            <Label>Equipment <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={cn(
                    'text-xs px-3 py-1 rounded-full border transition-colors',
                    equipment.includes(eq)
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  )}
                >
                  {EQUIPMENT_LABELS[eq] ?? eq}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim() || !instructions.trim()}>
              {pending ? 'Saving…' : 'Create exercise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
