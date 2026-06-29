'use client'

import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import type { BlockType } from '@/types/database'
import type { BuilderBlockExercise } from '@/types/builder'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExerciseConfigDialogProps {
  bex: BuilderBlockExercise
  blockType: BlockType
  isGlobalDuration: boolean
  freeMode?: 'time' | 'reps'
  onSave: (updates: Partial<BuilderBlockExercise>) => void
}

export function ExerciseConfigDialog({ bex, blockType, isGlobalDuration, freeMode, onSave }: ExerciseConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const [duration_s, setDuration_s] = useState<number | null>(bex.duration_s)
  const [reps, setReps] = useState<number | null>(bex.reps)
  const [sets, setSets] = useState<number | null>(bex.sets)
  const [rest_after_s, setRest_after_s] = useState<number>(bex.rest_after_s)

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      // Reset to current values on open
      setDuration_s(bex.duration_s)
      setReps(bex.reps)
      setSets(bex.sets)
      setRest_after_s(bex.rest_after_s)
    }
    setOpen(isOpen)
  }

  function parseNum(value: string): number | null {
    const n = parseInt(value, 10)
    return isNaN(n) || n <= 0 ? null : n
  }

  function handleSave() {
    onSave({ duration_s, reps, sets, rest_after_s })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Configure exercise"
          />
        }
      >
        <Settings2 className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="truncate">{bex.exercise.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {blockType === 'circuit' && !isGlobalDuration && (
            <ConfigField
              label="Duration (seconds)"
              value={duration_s ?? ''}
              onChange={(v) => setDuration_s(parseNum(v))}
            />
          )}
          {blockType === 'straight_sets' && (
            <ConfigField
              label="Reps"
              value={reps ?? ''}
              onChange={(v) => setReps(parseNum(v))}
            />
          )}
          {blockType === 'free' && freeMode === 'time' && !isGlobalDuration && (
            <ConfigField
              label="Duration (seconds)"
              value={duration_s ?? ''}
              onChange={(v) => setDuration_s(parseNum(v))}
            />
          )}
          {blockType === 'free' && freeMode === 'reps' && !isGlobalDuration && (
            <ConfigField
              label="Reps"
              value={reps ?? ''}
              onChange={(v) => setReps(parseNum(v))}
            />
          )}
          <ConfigField
            label="Rest after (seconds)"
            value={rest_after_s || ''}
            onChange={(v) => setRest_after_s(parseNum(v) ?? 0)}
          />
        </div>

        <DialogFooter>
          <Button onClick={handleSave}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfigField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="flex-1 text-sm">{label}</Label>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 text-right"
      />
    </div>
  )
}
