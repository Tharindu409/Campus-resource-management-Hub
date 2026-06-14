import { format, formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, User, CalendarDays, FileText, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { toBookingReference } from '../utils/bookingReference';

export default function BookingCard({ booking, onCancel, showUser = false, bookingReference }) {
  const canCancel = booking.status === 'PENDING' || booking.status === 'APPROVED';
  const resolvedReference = bookingReference || toBookingReference(booking.id);
  const createdDate = booking.createdAt ? new Date(booking.createdAt) : null;
  const hasValidCreatedDate = createdDate && !Number.isNaN(createdDate.getTime());
  const footerTimeText = hasValidCreatedDate
    ? `Requested ${formatDistanceToNow(createdDate, { addSuffix: true })}`
    : `Scheduled for ${format(new Date(booking.startTime), 'MMM d, yyyy')}`;

  return (
    <div
      className="glass-card p-5 transition-all duration-200 hover:scale-[1.01]"
      style={{ borderColor: booking.status === 'APPROVED' ? 'var(--status-approved-border)' : 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} style={{ color: 'var(--accent-mid)' }} className="flex-shrink-0" />
            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{booking.resourceName}</h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ref: {resolvedReference}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 mb-3 p-3 rounded-xl" style={{ background: 'var(--bg-section)' }}>
        <CalendarDays size={14} style={{ color: 'var(--primary)' }} />
        <div className="text-sm">
          <span style={{ color: 'var(--accent-mid)' }} className="font-medium">
            {format(new Date(booking.startTime), 'MMM d, yyyy')}
          </span>
          <span className="mx-2" style={{ color: 'var(--text-secondary)' }}>|</span>
          <Clock size={12} className="inline mr-1" style={{ color: 'var(--text-secondary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {format(new Date(booking.startTime), 'hh:mm a')} – {format(new Date(booking.endTime), 'hh:mm a')}
          </span>
        </div>
      </div>

      {/* Purpose */}
      <div className="flex items-start gap-2 mb-3">
        <FileText size={14} style={{ color: 'var(--primary)', marginTop: 2 }} />
        <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{booking.purpose}</p>
      </div>

      {/* User info (admin view) */}
      {showUser && (
        <div className="flex items-center gap-2 mb-3">
          <User size={14} style={{ color: 'var(--text-secondary)' }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{booking.userName} ({booking.userId})</span>
        </div>
      )}

      {/* Rejection reason */}
      {booking.status === 'REJECTED' && booking.rejectionReason && (
        <div className="mt-2 p-3 rounded-xl" style={{ background: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)' }}>
          <p className="text-xs" style={{ color: 'var(--status-rejected)' }}>
            <span className="font-semibold">Reason: </span>{booking.rejectionReason}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {footerTimeText}
        </span>
        {onCancel && canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ color: 'var(--status-rejected)', background: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)' }}
          >
            <XCircle size={13} />
            Cancel and Delete
          </button>
        )}
      </div>
    </div>
  );
}
