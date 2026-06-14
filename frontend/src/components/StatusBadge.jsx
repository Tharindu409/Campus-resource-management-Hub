const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    bg: 'var(--status-pending-bg)',
    color: 'var(--status-pending)',
    border: 'var(--status-pending-border)',
    dot: 'var(--status-pending)',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'var(--status-approved-bg)',
    color: 'var(--status-approved)',
    border: 'var(--status-approved-border)',
    dot: 'var(--status-approved)',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'var(--status-rejected-bg)',
    color: 'var(--status-rejected)',
    border: 'var(--status-rejected-border)',
    dot: 'var(--status-rejected)',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'var(--status-cancelled-bg)',
    color: 'var(--status-cancelled)',
    border: 'var(--status-cancelled-border)',
    dot: 'var(--status-cancelled)',
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const textSize = size === 'sm' ? '10px' : '11px';
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';

  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold rounded-full uppercase tracking-wide"
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontSize: textSize,
        padding,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.dot, boxShadow: `0 0 4px ${config.dot}` }}
      />
      {config.label}
    </span>
  );
}
