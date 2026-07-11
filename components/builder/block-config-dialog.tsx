'use client'

import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import type { BlockConfig, BlockType } from '@/types/database'
import type { BuilderBlock } from '@/types/builder'
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
import { cn } from '@/lib/utils'

const BLOCK_TYPES: { value: BlockType; label: string; description: string }[] = [
  { value: 'hiit', label: 'HIIT', description: 'Work + rest intervals × N rounds' },
  { value: 'tabata', label: 'Tabata', description: '20s work / 10s rest × 8 rounds' },
  { value: 'amrap', label: 'AMRAP', description: 'As many rounds as possible in time' },
  { value: 'emom', label: 'EMOM', description: 'Every minute on the minute' },
  { value: 'circuit', label: 'Circuit', description: 'Sequential exercises with rest' },
  { value: 'straight_sets', label: 'Straight Sets', description: 'X reps × N sets with rest' },
  { value: 'free', label: 'Free-form', description: 'Exercises by time or reps, global or per exercise' },
  { value: 'rest', label: 'Rest', description: 'Fixed rest period, no exercises' },
]

const TABATA_DEFAULTS: BlockConfig = { work_s: 20, rest_s: 10, rounds: 8 }

function defaultConfig(type: BlockType): BlockConfig {
  switch (type) {
    case 'hiit': return { work_s: 30, rest_s: 10, rounds: 8 }
    case 'tabata': return TABATA_DEFAULTS
    case 'amrap': return { total_duration_s: 600 }
    case 'emom': return { interval_s: 60, total_duration_s: 600 }
    case 'circuit': return { rounds: 3, rest_between_exercises_s: 30, rest_between_rounds_s: 60 }
    case 'straight_sets': return { sets: 3, rest_between_sets_s: 60 }
    case 'free': return { mode: 'time', work_s: 30 }
    case 'rest': return { rest_s: 60 }
  }
}

interface BlockConfigDialogProps {
  block: BuilderBlock
  onSave: (block_type: BlockType, config: BlockConfig) => void
}

export function BlockConfigDialog({ block, onSave }: BlockConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<BlockType>(block.block_type)
  const [config, setConfig] = useState<BlockConfig>(block.config)

  function handleTypeChange(type: BlockType) {
    setSelectedType(type)
    setConfig(defaultConfig(type))
  }

  function handleSave() {
    onSave(selectedType, config)
    setOpen(false)
  }

  function setNum(key: keyof BlockConfig, value: string) {
    const n = parseInt(value, 10)
    setConfig((prev) => ({ ...prev, [key]: isNaN(n) ? undefined : n }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="shrink-0" title="Configure block" />
        }
      >
        <Settings2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Block</DialogTitle>
        </DialogHeader>

        {/* Block type picker */}
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.value}
              type="button"
              onClick={() => handleTypeChange(bt.value)}
              className={cn(
                'rounded-lg border p-3 text-left text-sm transition-colors',
                selectedType === bt.value
                  ? 'border-foreground bg-foreground/5'
                  : 'border-border hover:border-foreground/30'
              )}
            >
              <span className="block font-medium">{bt.label}</span>
              <span className="block text-xs text-muted-foreground leading-tight mt-0.5">
                {bt.description}
              </span>
            </button>
          ))}
        </div>

        {/* Config fields per type */}
        <div className="space-y-3">
          {(selectedType === 'hiit' || selectedType === 'tabata') && (
            <>
              <ConfigField
                label="Work (seconds)"
                value={config.work_s ?? ''}
                onChange={(v) => setNum('work_s', v)}
                disabled={selectedType === 'tabata'}
              />
              <ConfigField
                label="Rest (seconds)"
                value={config.rest_s ?? ''}
                onChange={(v) => setNum('rest_s', v)}
                disabled={selectedType === 'tabata'}
              />
              <ConfigField
                label="Rounds"
                value={config.rounds ?? ''}
                onChange={(v) => setNum('rounds', v)}
                disabled={selectedType === 'tabata'}
              />
              {selectedType === 'tabata' && (
                <p className="text-xs text-muted-foreground">Tabata is fixed at 20s/10s × 8 rounds.</p>
              )}
            </>
          )}
          {selectedType === 'amrap' && (
            <ConfigField
              label="Total duration (seconds)"
              value={config.total_duration_s ?? ''}
              onChange={(v) => setNum('total_duration_s', v)}
            />
          )}
          {selectedType === 'emom' && (
            <>
              <ConfigField
                label="Interval (seconds)"
                value={config.interval_s ?? ''}
                onChange={(v) => setNum('interval_s', v)}
              />
              <ConfigField
                label="Total duration (seconds)"
                value={config.total_duration_s ?? ''}
                onChange={(v) => setNum('total_duration_s', v)}
              />
            </>
          )}
          {selectedType === 'circuit' && (
            <>
              <ConfigField
                label="Rounds"
                value={config.rounds ?? ''}
                onChange={(v) => setNum('rounds', v)}
              />
              <ConfigField
                label="Rest between exercises (seconds)"
                value={config.rest_between_exercises_s ?? ''}
                onChange={(v) => setNum('rest_between_exercises_s', v)}
              />
              <ConfigField
                label="Rest between rounds (seconds)"
                value={config.rest_between_rounds_s ?? ''}
                onChange={(v) => setNum('rest_between_rounds_s', v)}
              />
              {/* Duration mode toggle */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Exercise duration</p>
                <div className="flex rounded-md border overflow-hidden text-sm">
                  {(['global', 'per-exercise'] as const).map((mode) => {
                    const active = mode === 'global' ? !!config.work_s : !config.work_s
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          if (mode === 'global') setNum('work_s', '30')
                          else setConfig((prev) => { const { work_s: _, ...rest } = prev; return rest })
                        }}
                        className={`flex-1 px-3 py-1.5 transition-colors ${
                          active ? 'bg-foreground text-background' : 'hover:bg-muted'
                        }`}
                      >
                        {mode === 'global' ? 'Global' : 'Per exercise'}
                      </button>
                    )
                  })}
                </div>
                {config.work_s !== undefined && (
                  <ConfigField
                    label="Duration (seconds)"
                    value={config.work_s ?? ''}
                    onChange={(v) => setNum('work_s', v)}
                  />
                )}
              </div>
            </>
          )}
          {selectedType === 'straight_sets' && (
            <>
              <ConfigField
                label="Sets"
                value={config.sets ?? ''}
                onChange={(v) => setNum('sets', v)}
              />
              <ConfigField
                label="Rest between sets (seconds)"
                value={config.rest_between_sets_s ?? ''}
                onChange={(v) => setNum('rest_between_sets_s', v)}
              />
            </>
          )}
          {selectedType === 'free' && (
            <>
              {/* Time vs Reps mode */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Mode</p>
                <div className="flex rounded-md border overflow-hidden text-sm">
                  {(['time', 'reps'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        if (m === 'time') {
                          setConfig((prev) => ({ ...prev, mode: 'time', reps: undefined, work_s: prev.work_s ?? 30 }))
                        } else {
                          setConfig((prev) => ({ ...prev, mode: 'reps', work_s: undefined, reps: prev.reps ?? 10 }))
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 capitalize transition-colors ${
                        config.mode === m ? 'bg-foreground text-background' : 'hover:bg-muted'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Global vs Per exercise scope */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Value scope</p>
                <div className="flex rounded-md border overflow-hidden text-sm">
                  {(['global', 'per-exercise'] as const).map((scope) => {
                    const isGlobal = config.mode === 'time' ? !!config.work_s : !!config.reps
                    const active = scope === 'global' ? isGlobal : !isGlobal
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => {
                          if (scope === 'global') {
                            if (config.mode === 'time') setNum('work_s', '30')
                            else setNum('reps', '10')
                          } else {
                            setConfig((prev) => {
                              const { work_s: _w, reps: _r, ...rest } = prev
                              return rest
                            })
                          }
                        }}
                        className={`flex-1 px-3 py-1.5 transition-colors ${
                          active ? 'bg-foreground text-background' : 'hover:bg-muted'
                        }`}
                      >
                        {scope === 'global' ? 'Global' : 'Per exercise'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Global value field */}
              {config.mode === 'time' && config.work_s !== undefined && (
                <ConfigField
                  label="Duration (seconds)"
                  value={config.work_s}
                  onChange={(v) => setNum('work_s', v)}
                />
              )}
              {config.mode === 'reps' && config.reps !== undefined && (
                <ConfigField
                  label="Reps"
                  value={config.reps}
                  onChange={(v) => setNum('reps', v)}
                />
              )}

              {/* Rest scope toggle */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Rest</p>
                <div className="flex rounded-md border overflow-hidden text-sm">
                  {(['global', 'per-exercise'] as const).map((scope) => {
                    const active = scope === 'global' ? config.rest_between_exercises_s !== undefined : config.rest_between_exercises_s === undefined
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => {
                          if (scope === 'global') setNum('rest_between_exercises_s', '30')
                          else setConfig((prev) => { const { rest_between_exercises_s: _, ...rest } = prev; return rest })
                        }}
                        className={`flex-1 px-3 py-1.5 transition-colors ${
                          active ? 'bg-foreground text-background' : 'hover:bg-muted'
                        }`}
                      >
                        {scope === 'global' ? 'Global' : 'Per exercise'}
                      </button>
                    )
                  })}
                </div>
                {config.rest_between_exercises_s !== undefined && (
                  <ConfigField
                    label="Rest between exercises (seconds)"
                    value={config.rest_between_exercises_s}
                    onChange={(v) => setNum('rest_between_exercises_s', v)}
                  />
                )}
                {config.rest_between_exercises_s === undefined && (
                  <p className="text-xs text-muted-foreground">Set rest per exercise via the gear icon on each exercise.</p>
                )}
              </div>
            </>
          )}
          {selectedType === 'rest' && (
            <ConfigField
              label="Duration (seconds)"
              value={config.rest_s ?? ''}
              onChange={(v) => setNum('rest_s', v)}
            />
          )}
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
  disabled,
}: {
  label: string
  value: number | string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="flex-1 text-sm">{label}</Label>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-24 text-right"
      />
    </div>
  )
}
