import { useState } from 'react'
import {
  MapPin,
  Users,
  Wrench,
  Pencil,
  Trash2,
  Clock3,
  Eye,
  CalendarPlus,
} from 'lucide-react'

export default function ResourceCard({
  resource,
  isAdmin = false,
  onView,
  onBook,
  onEdit,
  onDelete,
  layout = 'grid',
}) {
  const [imageError, setImageError] = useState(false)

  const statusColor =
    resource?.status === 'ACTIVE'
      ? 'var(--status-approved)'
      : 'var(--status-rejected)'

  const statusBg =
    resource?.status === 'ACTIVE'
      ? 'var(--status-approved-bg)'
      : 'var(--status-rejected-bg)'

  const imageUrl = resource?.imageUrl?.trim()

  if (layout === 'list') {
    return (
      <div className="glass-card p-5 rounded-2xl flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-64 shrink-0">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={resource?.name || 'Resource'}
              className="w-full h-44 lg:h-full min-h-[180px] object-cover rounded-xl"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-44 lg:h-full min-h-[180px] rounded-xl flex items-center justify-center text-sm font-semibold"
              style={{
                background: 'var(--surface-muted)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              No Image
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3
                className="text-xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {resource?.name}
              </h3>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--accent-mid)' }}
              >
                {String(resource?.type || '').replaceAll('_', ' ')}
              </p>
            </div>

            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                color: statusColor,
                background: statusBg,
                border: `1px solid ${statusColor}33`,
              }}
            >
              {resource?.status}
            </span>
          </div>

          <p
            className="text-sm mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {resource?.description || 'No description available.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-5">
            <div
              className="flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <MapPin size={15} style={{ color: 'var(--accent-mid)' }} />
              <span>{resource?.location || 'N/A'}</span>
            </div>

            <div
              className="flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Users size={15} style={{ color: 'var(--accent-mid)' }} />
              <span>Capacity: {resource?.capacity ?? 0}</span>
            </div>

            <div
              className="flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Clock3 size={15} style={{ color: 'var(--accent-mid)' }} />
              <span>
                {resource?.availableFrom && resource?.availableTo
                  ? `${resource.availableFrom} - ${resource.availableTo}`
                  : 'No availability window'}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <button
              onClick={() => onView?.(resource)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{
                background: 'var(--status-approved-bg)',
                color: 'var(--status-approved)',
                border: '1px solid var(--status-approved-border)',
              }}
            >
              <Eye size={16} />
              View Only
            </button>

            {!isAdmin && (
              <button
                onClick={() => onBook?.(resource)}
                className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                  color: '#fff',
                  border: '1px solid rgba(34,211,238,0.25)',
                }}
              >
                <CalendarPlus size={16} />
                Book Now
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit?.(resource)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{
                    background: 'var(--status-pending-bg)',
                    color: 'var(--status-pending)',
                    border: '1px solid var(--status-pending-border)',
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  onClick={() => onDelete?.(resource)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{
                    background: 'var(--status-rejected-bg)',
                    color: 'var(--status-rejected)',
                    border: '1px solid var(--status-rejected-border)',
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 rounded-2xl h-full flex flex-col">
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={resource?.name || 'Resource'}
          className="w-full h-44 object-cover rounded-xl mb-4"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="w-full h-44 rounded-xl mb-4 flex items-center justify-center text-sm font-semibold"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          No Image
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {resource?.name}
          </h3>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--accent-mid)' }}
          >
            {String(resource?.type || '').replaceAll('_', ' ')}
          </p>
        </div>

        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            color: statusColor,
            background: statusBg,
            border: `1px solid ${statusColor}33`,
          }}
        >
          {resource?.status}
        </span>
      </div>

      <p
        className="text-sm mb-4"
        style={{ color: 'var(--text-secondary)' }}
      >
        {resource?.description || 'No description available.'}
      </p>

      <div className="space-y-2 text-sm mb-5">
        <div
          className="flex items-center gap-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <MapPin size={15} style={{ color: 'var(--accent-mid)' }} />
          <span>{resource?.location || 'N/A'}</span>
        </div>

        <div
          className="flex items-center gap-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Users size={15} style={{ color: 'var(--accent-mid)' }} />
          <span>Capacity: {resource?.capacity ?? 0}</span>
        </div>

        <div
          className="flex items-center gap-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Clock3 size={15} style={{ color: 'var(--accent-mid)' }} />
          <span>
            {resource?.availableFrom && resource?.availableTo
              ? `${resource.availableFrom} - ${resource.availableTo}`
              : 'No availability window'}
          </span>
        </div>
      </div>

      <div className="mt-auto">
        {isAdmin ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onView?.(resource)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{
                background: 'var(--status-approved-bg)',
                color: 'var(--status-approved)',
                border: '1px solid var(--status-approved-border)',
              }}
            >
              <Eye size={16} />
              View
            </button>

            <button
              onClick={() => onEdit?.(resource)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{
                background: 'var(--status-pending-bg)',
                color: 'var(--status-pending)',
                border: '1px solid var(--status-pending-border)',
              }}
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              onClick={() => onDelete?.(resource)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{
                background: 'var(--status-rejected-bg)',
                color: 'var(--status-rejected)',
                border: '1px solid var(--status-rejected-border)',
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onView?.(resource)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'var(--status-approved-bg)',
                color: 'var(--status-approved)',
                border: '1px solid var(--status-approved-border)',
              }}
            >
              <Eye size={16} />
              View Only
            </button>

            <button
              onClick={() => onBook?.(resource)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                color: '#fff',
                border: '1px solid rgba(34,211,238,0.25)',
              }}
            >
              <CalendarPlus size={16} />
              Book Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}