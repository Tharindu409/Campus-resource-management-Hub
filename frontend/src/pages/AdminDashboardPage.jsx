import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import ResourcePage from './ResourcePage';
import { AdminPanelPage } from './adminpanel';
import UserManagement from './UserManagement';
import ResourceCalendarPage from './ResourceCalendarPage';
import StatusBadge from '../components/StatusBadge';
import RejectionModal from '../components/RejectionModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { buildBookingReferenceMap } from '../utils/bookingReference';
import {
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  CheckSquare,
  AlertCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  UserCog,
  TrendingUp,
  CalendarRange,
  BarChart3,
  Activity,
  Building2,
  UserCheck,
  Timer,
  AlertTriangle,
  BookOpen,
  Package,
  LogOut,
} from 'lucide-react';

const FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function getBookingSortTimestamp(booking) {
  const createdAtMs = new Date(booking?.createdAt || '').getTime();
  if (Number.isFinite(createdAtMs) && createdAtMs > 0) return createdAtMs;

  const rawId = String(booking?.id || '').trim();
  const objectIdPrefix = rawId.slice(0, 8);
  if (/^[0-9a-fA-F]{8}$/.test(objectIdPrefix)) {
    const epochSeconds = Number.parseInt(objectIdPrefix, 16);
    if (Number.isFinite(epochSeconds) && epochSeconds > 0) {
      return epochSeconds * 1000;
    }
  }

  const startTimeMs = new Date(booking?.startTime || '').getTime();
  if (Number.isFinite(startTimeMs) && startTimeMs > 0) return startTimeMs;

  return 0;
}

function sortBookingsNewestFirst(bookings) {
  return [...(bookings || [])].sort(
    (a, b) => getBookingSortTimestamp(b) - getBookingSortTimestamp(a)
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [rejectModal, setRejectModal] = useState(null); // booking to reject
  const [activePanel, setActivePanel] = useState('overview');

  const { logout } = useAuth();
  const switchPanel = (panel) => {
    setActivePanel(panel);
    if (panel === 'bookings') setFilter('ALL');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        bookingApi.getAll(),
        bookingApi.getStats(),
      ]);
      setBookings(sortBookingsNewestFirst(bookingsRes.data));
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      const response = await bookingApi.approve(id);
      if (response?.data) {
        toast.success('Booking approved successfully!');
        fetchData();
      } else {
        toast.error('No response from server');
      }
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve booking.');
    }
  };

  const handleRejectConfirm = async (id, reason) => {
    try {
      const response = await bookingApi.reject(id, reason);
      if (response?.data) {
        toast.success('Booking rejected successfully.');
        fetchData();
      } else {
        toast.error('No response from server');
      }
    } catch (err) {
      console.error('Reject error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject booking.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const response = await bookingApi.cancel(id, currentUser.userId, 'ADMIN');
      if (response?.data) {
        toast.success('Booking cancelled successfully.');
        fetchData();
      } else {
        toast.error('No response from server');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel booking.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking from database permanently?')) return;
    try {
      await bookingApi.deleteById(id);
      toast.success('Booking deleted from database.');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete booking.');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const filtered = bookings
    .filter(b => filter === 'ALL' || b.status === filter)
    .filter(b =>
      search === '' ||
      String(b.resourceName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.purpose || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let va;
      let vb;

      if (sortField === 'createdAt') {
        va = getBookingSortTimestamp(a);
        vb = getBookingSortTimestamp(b);
      } else if (['startTime', 'endTime'].includes(sortField)) {
        va = new Date(a?.[sortField] || '').getTime();
        vb = new Date(b?.[sortField] || '').getTime();
        va = Number.isFinite(va) ? va : 0;
        vb = Number.isFinite(vb) ? vb : 0;
      } else {
        va = a[sortField];
        vb = b[sortField];
        if (typeof va === 'string') {
          va = va.toLowerCase();
          vb = String(vb || '').toLowerCase();
        }
      }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const bookingReferences = buildBookingReferenceMap(bookings);
  const pendingBookings = bookings.filter((booking) => booking.status === 'PENDING');
  const approvedCount = stats.APPROVED || 0;
  const rejectedCount = stats.REJECTED || 0;
  const cancelledCount = stats.CANCELLED || 0;
  const totalCount = stats.TOTAL || 0;

  const uniqueUsers = new Set(bookings.map((booking) => booking.userId).filter(Boolean)).size;
  const uniqueResources = new Set(bookings.map((booking) => booking.resourceId).filter(Boolean)).size;

  const averageDurationHours = (() => {
    if (bookings.length === 0) return 0;
    const totalMs = bookings.reduce((sum, booking) => {
      const start = new Date(booking.startTime).getTime();
      const end = new Date(booking.endTime).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum;
      return sum + (end - start);
    }, 0);
    return totalMs / bookings.length / (1000 * 60 * 60);
  })();

  const activeNow = (() => {
    const now = Date.now();
    return bookings.filter((booking) => {
      if (booking.status !== 'APPROVED') return false;
      const start = new Date(booking.startTime).getTime();
      const end = new Date(booking.endTime).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return now >= start && now <= end;
    }).length;
  })();

  const rejectionRate = totalCount ? Math.round((rejectedCount / totalCount) * 100) : 0;
  const cancellationRate = totalCount ? Math.round((cancelledCount / totalCount) * 100) : 0;
  const approvalRate = totalCount ? Math.round((approvedCount / totalCount) * 100) : 0;
  const pendingRate = totalCount ? Math.round(((stats.PENDING || 0) / totalCount) * 100) : 0;

  const sidebarLinks = [
    { label: 'Overview', icon: <LayoutDashboard size={16} />, value: 'overview', active: activePanel === 'overview' },
    { label: 'Bookings', icon: <BookOpen size={16} />, value: 'bookings', active: activePanel === 'bookings' },
    { label: 'Resources', icon: <Package size={16} />, value: 'resources', active: activePanel === 'resources' },
    { label: 'Tickets', icon: <ClipboardList size={16} />, value: 'tickets', active: activePanel === 'tickets' },
    { label: 'Users', icon: <Users size={16} />, value: 'users', active: activePanel === 'users' },
    { label: 'Calendar', icon: <CalendarRange size={16} />, value: 'calendar', active: activePanel === 'calendar' },
  ];

  const peakHour = (() => {
    const bucket = new Array(24).fill(0);
    bookings.forEach((booking) => {
      const hour = new Date(booking.startTime).getHours();
      if (!Number.isNaN(hour)) bucket[hour] += 1;
    });
    let maxHour = 0;
    for (let i = 1; i < bucket.length; i += 1) {
      if (bucket[i] > bucket[maxHour]) maxHour = i;
    }
    return { hour: maxHour, volume: bucket[maxHour] };
  })();

  const topResources = (() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const key = booking.resourceName || booking.resourceId || 'Unknown Resource';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([resource, count]) => ({ resource, count }));
  })();

  const last7Days = (() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      data.push({
        date: d,
        label: format(d, 'EEE'),
        total: 0,
      });
    }
    bookings.forEach((booking) => {
      const created = new Date(booking.createdAt || booking.startTime);
      if (Number.isNaN(created.getTime())) return;
      const dayKey = format(created, 'yyyy-MM-dd');
      const idx = data.findIndex((item) => format(item.date, 'yyyy-MM-dd') === dayKey);
      if (idx >= 0) data[idx].total += 1;
    });
    return data;
  })();

  const weeklyPeak = Math.max(...last7Days.map((item) => item.total), 1);
  const riskLevel = pendingRate >= 30 || rejectionRate >= 20 ? 'High' : pendingRate >= 15 || rejectionRate >= 10 ? 'Moderate' : 'Healthy';

  const statCards = [
    { label: 'Total', value: stats.TOTAL || 0, icon: <Users size={20} />, color: 'var(--primary)', bg: 'rgba(249,115,22,0.08)' },
    { label: 'Pending', value: stats.PENDING || 0, icon: <Clock size={20} />, color: 'var(--status-pending)', bg: 'var(--status-pending-bg)' },
    { label: 'Approved', value: stats.APPROVED || 0, icon: <CheckSquare size={20} />, color: 'var(--status-approved)', bg: 'var(--status-approved-bg)' },
    { label: 'Rejected', value: stats.REJECTED || 0, icon: <AlertCircle size={20} />, color: 'var(--status-rejected)', bg: 'var(--status-rejected-bg)' },
  ];

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid rgba(15,23,42,0.04)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const managementSections = [
    {
      title: 'Booking Governance',
      detail: 'Moderate approval flow, cancellations, and policy outcomes for all booking requests.',
      icon: <ShieldCheck size={18} />,
      cta: 'Open Bookings',
      onClick: () => switchPanel('bookings'),
    },
    {
      title: 'Ticket Operations',
      detail: 'Assign technicians, update lifecycle stages, and control resolution quality.',
      icon: <ClipboardList size={18} />,
      cta: 'Open Ticket Admin',
      onClick: () => switchPanel('tickets'),
    },
    {
      title: 'Access Management',
      detail: 'Manage account roles and enforce least-privilege access patterns.',
      icon: <UserCog size={18} />,
      cta: 'Open User Roles',
      onClick: () => switchPanel('users'),
    },
  ];

  return (
    <div className="min-h-screen w-full px-4 py-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="relative mx-auto w-full max-w-full">
        <div className="pointer-events-none absolute -left-24 -top-14 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(249,115,22,0.12)' }} />
        <div className="pointer-events-none absolute right-0 top-28 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(253,186,116,0.16)' }} />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] min-h-[calc(100vh-4rem)]">
          <aside className="rounded-3xl border p-4 lg:sticky lg:top-16 self-start lg:h-[calc(100vh-4rem)]" style={{ borderColor: 'rgba(249,115,22,0.18)', background: 'linear-gradient(180deg, rgba(249,115,22,0.14), rgba(255,255,255,0.96))' }}>
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--primary)' }}>
                Admin Console
              </p>
              <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm leading-tight" style={{ color: 'var(--text-secondary)' }}>
                Manage bookings, tickets, users, and campus resources from one workspace.
              </p>
            </div>

            <div className="space-y-2">
              {sidebarLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => switchPanel(link.value)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-left transition-all"
                  style={{
                    background: link.active ? 'rgba(249,115,22,0.12)' : 'transparent',
                    color: link.active ? 'var(--primary)' : 'var(--text-primary)',
                    border: link.active ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                  }}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl" style={{ background: link.active ? 'rgba(249,115,22,0.12)' : 'rgba(15,23,42,0.04)', color: link.active ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border bg-white/80 p-3 shadow-sm" style={{ borderColor: 'rgba(249,115,22,0.14)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.20em] text-slate-500">Quick action</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#EA580C]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

          </aside>

          <main>
            {activePanel === 'overview' && (
              <>
                <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  <Activity size={12} style={{ color: 'var(--primary)' }} /> Active Right Now
                </p>
                <p className="mt-2 text-3xl font-black" style={{ color: 'var(--primary)' }}>{activeNow}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Approved bookings currently in progress</p>
              </article>

              <article className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  <Building2 size={12} style={{ color: 'var(--primary)' }} /> Resource Footprint
                </p>
                <p className="mt-2 text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{uniqueResources}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Distinct resources used in current dataset</p>
              </article>

              <article className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  <UserCheck size={12} style={{ color: 'var(--primary)' }} /> User Adoption
                </p>
                <p className="mt-2 text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{uniqueUsers}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Unique requesters across all bookings</p>
              </article>

              <article className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  <Timer size={12} style={{ color: 'var(--primary)' }} /> Avg Duration
                </p>
                <p className="mt-2 text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{averageDurationHours.toFixed(1)}h</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Average time per booking allocation</p>
              </article>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                  <BarChart3 size={12} /> Site Performance Analysis
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Approval Rate</p>
                    <p className="mt-1 text-2xl font-black" style={{ color: 'var(--status-approved)' }}>{approvalRate}%</p>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pending Pressure</p>
                    <p className="mt-1 text-2xl font-black" style={{ color: 'var(--status-pending)' }}>{pendingRate}%</p>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Rejection Rate</p>
                    <p className="mt-1 text-2xl font-black" style={{ color: 'var(--status-rejected)' }}>{rejectionRate}%</p>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cancellation Rate</p>
                    <p className="mt-1 text-2xl font-black" style={{ color: 'var(--text-secondary)' }}>{cancellationRate}%</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>7-Day Request Trend</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Peak: {weeklyPeak}</p>
                  </div>
                  <div className="flex items-end gap-2">
                    {last7Days.map((day) => (
                      <div key={day.label} className="flex-1 text-center">
                        <div className="mx-auto flex h-28 w-full items-end rounded-md" style={{ background: 'rgba(249,115,22,0.08)' }}>
                          <div
                            className="w-full rounded-md"
                            style={{
                              height: `${Math.max(8, Math.round((day.total / weeklyPeak) * 100))}%`,
                              background: 'linear-gradient(180deg, rgba(249,115,22,0.95), rgba(234,88,12,0.8))',
                            }}
                          />
                        </div>
                        <p className="mt-2 text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{day.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="space-y-4">
                <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                  <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                    <AlertTriangle size={12} /> Risk Signals
                  </p>
                  <p className="mt-3 text-2xl font-black" style={{ color: riskLevel === 'High' ? 'var(--status-rejected)' : riskLevel === 'Moderate' ? 'var(--status-pending)' : 'var(--status-approved)' }}>
                    {riskLevel}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Based on pending queue pressure and rejection behavior.
                  </p>
                  <div className="mt-4 rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Peak Start Hour</p>
                    <p className="mt-1 text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                      {String(peakHour.hour).padStart(2, '0')}:00 ({peakHour.volume} requests)
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
                  <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                    <CalendarRange size={12} /> Top Resource Demand
                  </p>
                  <div className="mt-3 space-y-2">
                    {topResources.map((resource) => (
                      <div key={resource.resource} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{resource.resource}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{resource.count} bookings</p>
                      </div>
                    ))}
                    {topResources.length === 0 && (
                      <p className="rounded-xl border p-3 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)', color: 'var(--text-secondary)' }}>
                        No booking demand data available.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              {managementSections.map((section) => (
                <article key={section.title} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--primary)' }}>
                    {section.icon}
                  </div>
                  <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{section.title}</h2>
                  <p className="mt-2 min-h-14 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.detail}</p>
                  <button
                    onClick={section.onClick}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)' }}
                  >
                    {section.cta} <ArrowRight size={12} />
                  </button>
                </article>
              ))}
            </section>
          </>
        )}

        {activePanel === 'resources' && (
          <section className="mt-6">
            <ResourcePage />
          </section>
        )}
        {activePanel === 'tickets' && (
          <section className="mt-6">
            <AdminPanelPage />
          </section>
        )}
        {activePanel === 'users' && (
          <section className="mt-6">
            <UserManagement />
          </section>
        )}
        {activePanel === 'calendar' && (
          <section className="mt-6">
            <ResourceCalendarPage />
          </section>
        )}

        {activePanel === 'bookings' && (
          <section className="mt-6 grid gap-6">
          <div className="rounded-3xl border p-4 md:p-5" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.94)' }}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-lg">
                <Search size={16} className="absolute left-3 top-3" style={{ color: 'var(--muted)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by resource, user, or purpose..."
                  className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                    style={{
                      background: filter === f ? 'rgba(249,115,22,0.1)' : 'transparent',
                      color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
                      border: filter === f ? '1px solid rgba(249,115,22,0.28)' : '1px solid var(--border)',
                    }}
                  >
                    {f} {f !== 'ALL' && `(${bookings.filter(b => b.status === f).length})`}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--primary)' }} />
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'var(--bg-section)' }}>
                        <th style={thStyle} onClick={() => handleSort('id')}><span className="flex items-center gap-1">Booking Ref<SortIcon field="id" /></span></th>
                        <th style={thStyle} onClick={() => handleSort('resourceName')}><span className="flex items-center gap-1">Resource<SortIcon field="resourceName" /></span></th>
                        <th style={thStyle} onClick={() => handleSort('userName')}><span className="flex items-center gap-1">User<SortIcon field="userName" /></span></th>
                        <th style={thStyle} onClick={() => handleSort('startTime')}><span className="flex items-center gap-1">Time Slot<SortIcon field="startTime" /></span></th>
                        <th style={thStyle}>Purpose</th>
                        <th style={thStyle} onClick={() => handleSort('status')}><span className="flex items-center gap-1">Status<SortIcon field="status" /></span></th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                            No bookings match your criteria.
                          </td>
                        </tr>
                      ) : filtered.map((b, i) => (
                        <tr
                          key={b.id}
                          className="transition-colors"
                          style={{
                            borderBottom: '1px solid rgba(15,23,42,0.05)',
                            background: i % 2 === 0 ? 'white' : 'var(--bg-section)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : 'var(--bg-section)'}
                        >
                          <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }} className="text-xs font-mono">{bookingReferences[b.id]}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{b.resourceName}</p>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{b.userName}</p>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{format(new Date(b.startTime), 'MMM d, yyyy')}</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {format(new Date(b.startTime), 'hh:mm a')} - {format(new Date(b.endTime), 'hh:mm a')}
                            </p>
                          </td>
                          <td style={{ padding: '14px 16px', maxWidth: 280, minWidth: 220 }}>
                            <p
                              className="text-xs leading-5 whitespace-normal break-words"
                              style={{ color: 'var(--text-secondary)' }}
                              title={b.purpose || 'No purpose provided'}
                            >
                              {b.purpose || 'No purpose provided'}
                            </p>
                            {b.status === 'REJECTED' && b.rejectionReason && (
                              <p className="mt-1 text-xs" style={{ color: 'var(--status-rejected)' }} title={b.rejectionReason}>
                                {b.rejectionReason.substring(0, 40)}{b.rejectionReason.length > 40 ? '...' : ''}
                              </p>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}><StatusBadge status={b.status} size="sm" /></td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div className="flex items-center justify-end gap-2">
                              {b.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(b.id)}
                                    title="Approve"
                                    className="rounded-lg p-1.5 transition-all hover:scale-110"
                                    style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved)', border: '1px solid var(--status-approved-border)' }}
                                  >
                                    <CheckCircle size={15} />
                                  </button>
                                  <button
                                    onClick={() => setRejectModal(b)}
                                    title="Reject"
                                    className="rounded-lg p-1.5 transition-all hover:scale-110"
                                    style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected)', border: '1px solid var(--status-rejected-border)' }}
                                  >
                                    <XCircle size={15} />
                                  </button>
                                </>
                              )}
                              {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                                <button
                                  onClick={() => handleCancel(b.id)}
                                  title="Cancel"
                                  className="rounded-lg p-1.5 transition-all hover:scale-110"
                                  style={{ background: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled)', border: '1px solid var(--status-cancelled-border)' }}
                                >
                                  <Ban size={15} />
                                </button>
                              )}
                              {(b.status === 'REJECTED' || b.status === 'CANCELLED') && (
                                <button
                                  onClick={() => handleDelete(b.id)}
                                  title="Delete from DB"
                                  className="rounded-lg p-1.5 transition-all hover:scale-110"
                                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filtered.length > 0 && (
                  <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Showing {filtered.length} of {bookings.length} bookings</p>
                  </div>
                )}
              </div>
            )}
          </div>

          </section>
        )}
          </main>
        </div>
      </div>

      {rejectModal && (
        <RejectionModal
          booking={rejectModal}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectModal(null)}
        />
      )}
    </div>
  );
}
