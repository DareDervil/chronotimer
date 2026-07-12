export interface BlockColorMeta {
  bar: string
  badge: string
  text: string
  stroke: string
  label: string
}

export const BLOCK_META: Record<string, BlockColorMeta> = {
  hiit:          { bar: 'bg-red-500',     badge: 'bg-red-500/15 text-red-400 border-red-500/30',              text: 'text-red-400',     stroke: '#ef4444', label: 'HIIT' },
  tabata:        { bar: 'bg-orange-500',  badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',     text: 'text-orange-400',  stroke: '#f97316', label: 'Tabata' },
  amrap:         { bar: 'bg-blue-500',    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',           text: 'text-blue-400',    stroke: '#3b82f6', label: 'AMRAP' },
  emom:          { bar: 'bg-purple-500',  badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',     text: 'text-purple-400',  stroke: '#a855f7', label: 'EMOM' },
  circuit:       { bar: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',  text: 'text-emerald-400', stroke: '#10b981', label: 'Circuit' },
  straight_sets: { bar: 'bg-amber-500',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',        text: 'text-amber-400',   stroke: '#f59e0b', label: 'Sets' },
  free:          { bar: 'bg-sky-500',     badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',              text: 'text-sky-400',     stroke: '#0ea5e9', label: 'Free-form' },
  rest:          { bar: 'bg-slate-500',   badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',        text: 'text-slate-400',   stroke: '#64748b', label: 'Rest' },
}

export const FALLBACK_STROKE_COLOR = '#9ca3af'
