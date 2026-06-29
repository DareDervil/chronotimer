'use client'

import type { Exercise } from '@/types/database'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BodyHeatmap, HeatmapLegend } from './body-heatmap'

// Maps wger Latin names to friendlier display labels
const MUSCLE_DISPLAY: Record<string, string> = {
  'Anterior deltoid': 'Shoulders',
  'Biceps brachii': 'Biceps',
  'Biceps femoris': 'Hamstrings',
  'Brachialis': 'Upper Arm',
  'Brachioradialis': 'Forearms',
  'Gastrocnemius': 'Calves',
  'Gluteus maximus': 'Glutes',
  'Infraspinatus': 'Upper Back',
  'Latissimus dorsi': 'Lats',
  'Obliquus externus abdominis': 'Obliques',
  'Pectoralis major': 'Chest',
  'Quadriceps femoris': 'Quads',
  'Rectus abdominis': 'Abs',
  'Serratus anterior': 'Serratus',
  'Soleus': 'Calves (deep)',
  'Trapezius': 'Traps',
  'Triceps brachii': 'Triceps',
}
function muscleLabel(name: string): string {
  return MUSCLE_DISPLAY[name] ?? name
}

const CATEGORY_LABELS = {
  warmup: 'Warm-Up',
  cardio: 'Cardio',
  strength: 'Strength',
  mobility: 'Mobility',
}

interface ExerciseDetailSheetProps {
  exercise: Exercise | null
  onClose: () => void
}

export function ExerciseDetailSheet({ exercise, onClose }: ExerciseDetailSheetProps) {
  return (
    <Sheet open={!!exercise} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto gap-0 p-0">
        {exercise && (
          <>
            <SheetHeader className="p-5 pb-4">
              <div className="flex items-start gap-2 pr-8">
                <div className="flex-1">
                  <Badge variant="outline" className="text-xs mb-2">
                    {CATEGORY_LABELS[exercise.category]}
                  </Badge>
                  <SheetTitle className="text-lg leading-tight">{exercise.name}</SheetTitle>
                  {exercise.description && (
                    <SheetDescription className="mt-1 text-sm">{exercise.description}</SheetDescription>
                  )}
                </div>
              </div>
            </SheetHeader>

            <Separator />

            {/* Body heatmap */}
            {(exercise.primary_muscles.length > 0 || exercise.secondary_muscles.length > 0) && (
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  Muscles Targeted
                </p>
                <BodyHeatmap
                  primary={exercise.primary_muscles}
                  secondary={exercise.secondary_muscles}
                />
                <HeatmapLegend />

                {/* Muscle chips */}
                <div className="mt-4 space-y-2">
                  {exercise.primary_muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.primary_muscles.map((m) => (
                        <span
                          key={m}
                          className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 border border-orange-200"
                        >
                          {muscleLabel(m)}
                        </span>
                      ))}
                    </div>
                  )}
                  {exercise.secondary_muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.secondary_muscles.map((m) => (
                        <span
                          key={m}
                          className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          {muscleLabel(m)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Instructions */}
            {exercise.instructions && (
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  How to Perform
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">{exercise.instructions}</p>
              </div>
            )}

            {/* Video */}
            {exercise.video_url && (
              <>
                <Separator />
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Video
                  </p>
                  <a
                    href={exercise.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    Watch on YouTube ↗
                  </a>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
