import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { bookingApi } from '../api/bookingApi';
import BookingCard from '../components/BookingCard';
import toast from 'react-hot-toast';
import { BookOpen, RefreshCw, PlusCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildBookingReferenceMap } from '../utils/bookingReference';

const FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function getBookingSortTimestamp(booking) {
  const createdAtMs = new Date(booking?.createdAt || '').getTime();
  if (Number.isFinite(createdAtMs) && createdAtMs > 0) return createdAtMs;

  const startTimeMs = new Date(booking?.startTime || '').getTime();
  if (Number.isFinite(startTimeMs) && startTimeMs > 0) return startTimeMs;

  return 0;
}

function sortBookingsNewestFirst(bookings) {
  return [...(bookings || [])].sort(
    (a, b) => getBookingSortTimestamp(b) - getBookingSortTimestamp(a)
  );
}

export default function MyBookingsPage() {
  const { currentUser } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getMyBookings(currentUser.userId);
      setBookings(sortBookingsNewestFirst(res.data));
    } catch {
      toast.error('Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.userId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);



  const handleCancel = async (id) => {
    if (!window.confirm('Cancel and delete this booking?')) return;
    try {
      await bookingApi.cancelAndDelete(id, currentUser.userId, 'USER');
      setBookings(prev => prev.filter(booking => booking.id !== id));
      toast.success('Booking cancelled and deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel and delete booking.');
    }
  };

  const filtered = bookings
    .filter(b => filter === 'ALL' || b.status === filter)
    .filter(b =>
      search === '' ||
      b.resourceName.toLowerCase().includes(search.toLowerCase()) ||
      b.purpose.toLowerCase().includes(search.toLowerCase())
    );

  const bookingReferences = buildBookingReferenceMap(bookings);

  const filterBg = { PENDING: 'var(--status-pending)', APPROVED: 'var(--status-approved)', REJECTED: 'var(--status-rejected)', CANCELLED: 'var(--status-cancelled)' };

  return (
    <div className="min-h-screen py-10 px-4 page-enter">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}>
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Bookings</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your reservations</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchBookings} className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-section)]" style={{ color: 'var(--primary)' }}>
              <RefreshCw size={18} />
            </button>
            <Link
              to="/create"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}
            >
              <PlusCircle size={16} />
              New
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by resource or purpose..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: filter === f ? (f === 'PENDING' ? 'var(--status-pending-bg)' : f === 'APPROVED' ? 'var(--status-approved-bg)' : f === 'REJECTED' ? 'var(--status-rejected-bg)' : 'var(--status-cancelled-bg)') : 'transparent',
                  color: filter === f ? (filterBg[f] || 'var(--accent-mid)') : 'var(--muted)',
                  border: filter === f ? `1px solid ${f === 'PENDING' ? 'var(--status-pending-border)' : f === 'APPROVED' ? 'var(--status-approved-border)' : f === 'REJECTED' ? 'var(--status-rejected-border)' : 'var(--status-cancelled-border)'}` : '1px solid var(--border)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => {
                const count = bookings.filter(b => b.status === s).length;
                return (
                  <div key={s} className="glass-card p-3 text-center">
                    <p className="text-2xl font-bold" style={{ color: s === 'PENDING' ? 'var(--status-pending)' : s === 'APPROVED' ? 'var(--status-approved)' : s === 'REJECTED' ? 'var(--status-rejected)' : 'var(--status-cancelled)' }}>{count}</p>
                    <p className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>{s.toLowerCase()}</p>
                  </div>
                );
              })}
            </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No bookings found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {search || filter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Create your first booking!'}
            </p>
            <Link to="/create" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}>
              <PlusCircle size={16} /> Create Booking
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={handleCancel}
                bookingReference={bookingReferences[b.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
