import { useNotifications } from '../../context/NotificationContext';
import { FaTimes, FaTrash, FaCheckDouble } from 'react-icons/fa';
import { format } from 'date-fns';

export default function NotificationPanel({ onClose }) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-[0_20px_50px_rgba(17,24,39,0.12)]
                    border border-[var(--border)] z-50 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-xs flex items-center gap-1"
          >
            <FaCheckDouble size={12} /> All read
          </button>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <FaTimes size={16} />
          </button>
        </div>
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-[var(--text-secondary)]">
          No notifications yet 🔔
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => !notification.read && markAsRead(notification.id)}
            className={`p-4 border-b cursor-pointer hover:bg-[var(--bg-section)] transition-colors
                       ${!notification.read ? 'bg-[rgba(249,115,22,0.08)]' : ''}`}
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium text-sm text-[var(--text-primary)]">
                  {notification.title}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <div className="w-2 h-2 bg-[var(--primary)] rounded-full"></div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}