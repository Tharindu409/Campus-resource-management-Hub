import React from 'react'

const STATUS_STYLES = {
  OPEN: 'bg-amber-100 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 border-orange-200',
  RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
}

export function TicketStatusBadge({ status }) {
  const normalized = String(status || 'OPEN').toUpperCase()
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${
        STATUS_STYLES[normalized] || STATUS_STYLES.OPEN
      }`}
    >
      {normalized.replace('_', ' ')}
    </span>
  )
}
