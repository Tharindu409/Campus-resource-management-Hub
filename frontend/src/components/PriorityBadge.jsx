import React from 'react'
import { AlertTriangle } from 'lucide-react'

const PRIORITY_STYLES = {
  LOW: 'text-slate-600 bg-slate-100 border-slate-200',
  MEDIUM: 'text-amber-700 bg-amber-100 border-amber-200',
  HIGH: 'text-orange-700 bg-orange-100 border-orange-200',
  CRITICAL: 'text-rose-700 bg-rose-100 border-rose-200 shadow-md',
  UNKNOWN: 'text-slate-600 bg-slate-100 border-slate-200',
}

export function PriorityBadge({ priority, className = '' }) {
  const normalized = String(priority || 'UNKNOWN').toUpperCase()
  const style = PRIORITY_STYLES[normalized] || PRIORITY_STYLES.UNKNOWN

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${style} ${className}`}
    >
      <AlertTriangle size={12} />
      {normalized}
    </span>
  )
}
