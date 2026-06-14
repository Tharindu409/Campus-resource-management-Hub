import { useNotifications } from '../context/NotificationContext';
import { FaTrash, FaCheckDouble } from 'react-icons/fa';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--bg-primary)' }}>
      <nav className="shadow-sm px-6 py-4 flex items-center gap-4 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.9)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
          style={{
            background: 'var(--bg-section)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-section)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>🔔 Notifications</h1>
      </nav>

      <main className="max-w-3xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            All Notifications ({notifications.length})
          </h2>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            <FaCheckDouble size={14} />
            Mark all as read
          </button>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-xl p-8 text-center glass-card border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              No notifications yet 🔔
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className="rounded-xl p-5 cursor-pointer transition-all duration-200 glass-card border hover:shadow-lg"
                style={{
                  borderColor: !notification.read ? 'var(--primary)' : 'var(--border)',
                  borderLeft: !notification.read ? '4px solid' : '1px solid',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {notification.title}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {notification.message}
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                      {format(new Date(notification.createdAt), 'MMM dd, yyyy - HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!notification.read && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(249,115,22,0.08)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                        New
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="transition-colors"
                      style={{ color: 'var(--primary)' }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}