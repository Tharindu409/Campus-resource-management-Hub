import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function RejectionModal({ booking, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    onConfirm(booking.id, reason.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17, 24, 39, 0.35)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel-strong w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]"
        style={{ color: 'var(--text-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--status-rejected)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Reject Booking</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Review and provide rejection reason</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Booking info */}
        {booking && (
          <div
            className="mb-4 p-3 rounded-xl"
            style={{
              background: 'var(--bg-section)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <p className="text-sm font-medium">{booking.resourceName}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {booking.userName} — {booking.purpose?.substring(0, 60)}{booking.purpose?.length > 60 ? '...' : ''}
            </p>
          </div>
        )}

        {/* Reason input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Rejection Reason <span style={{ color: 'var(--status-rejected)' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            rows={4}
            placeholder="Explain why this booking is being rejected..."
            className="w-full px-4 py-3 text-sm placeholder:text-secondary rounded-xl resize-none outline-none transition-all duration-200"
            style={{
              background: 'white',
              border: error ? '1px solid var(--status-rejected-border)' : '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-mid)'; }}
            onBlur={e => { e.target.style.borderColor = error ? 'var(--status-rejected-border)' : 'var(--border)'; }}
          />
          {error && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ background: 'var(--bg-section)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-98"
            style={{ background: 'linear-gradient(135deg, var(--status-rejected), #b91c1c)', color: 'white' }}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
