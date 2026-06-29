'use client'

import { useEffect, useRef } from 'react'
import type { IExerciseData } from 'body-highlighter'

// wger Latin names that body-highlighter's alias map doesn't cover directly
const WGER_OVERRIDES: Record<string, string> = {
  'Anterior deltoid': 'front-deltoids',
  'Latissimus dorsi': 'upper-back',
  'Obliquus externus abdominis': 'obliques',
}

function resolveMuscleName(name: string): string {
  return WGER_OVERRIDES[name] ?? name
}

interface BodyHeatmapProps {
  primary: string[]
  secondary: string[]
}

export function BodyHeatmap({ primary, secondary }: BodyHeatmapProps) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!frontRef.current || !backRef.current) return

    let destroyed = false
    let frontInst: { destroy: () => void } | null = null
    let backInst: { destroy: () => void } | null = null

    import('body-highlighter').then(({ createBodyHighlighter, ModelType }) => {
      if (destroyed) return

      const data: IExerciseData[] = [
        { name: 'secondary', muscles: secondary.map(resolveMuscleName), frequency: 1 },
        { name: 'primary',   muscles: primary.map(resolveMuscleName),   frequency: 2 },
      ]

      const opts = {
        data,
        bodyColor: 'hsl(0,0%,22%)',
        highlightedColors: ['hsl(38,90%,60%)', 'hsl(25,95%,55%)'],
      }

      frontInst = createBodyHighlighter({ container: frontRef.current!, type: ModelType.ANTERIOR, ...opts })
      backInst  = createBodyHighlighter({ container: backRef.current!,  type: ModelType.POSTERIOR, ...opts })
    })

    return () => {
      destroyed = true
      frontInst?.destroy()
      backInst?.destroy()
    }
  }, [primary, secondary])

  return (
    <div className="flex gap-4 w-full max-w-xs mx-auto">
      <div className="flex-1 flex flex-col items-center">
        <div ref={frontRef} className="w-full" style={{ aspectRatio: '1/2' }} />
        <span className="text-[9px] text-muted-foreground mt-0.5">Front</span>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <div ref={backRef} className="w-full" style={{ aspectRatio: '1/2' }} />
        <span className="text-[9px] text-muted-foreground mt-0.5">Back</span>
      </div>
    </div>
  )
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-1">
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-[hsl(25,95%,55%)]" />
        Primary
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-[hsl(38,90%,60%)]" />
        Secondary
      </span>
    </div>
  )
}
