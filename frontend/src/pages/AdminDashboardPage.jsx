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
import { format, formatDistanceToNow } from 'date-fns';
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
  ChevronsUpDown,
  Users,
  Clock,
  CheckSquare,
  AlertCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  UserCog,
  CalendarRange,
  Activity,
  Building2,
  UserCheck,
  Timer,
  BookOpen,
  Package,
  LogOut,
  Inbox,
  SearchX,
} from 'lucide-react';

const FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const FILTER_LABELS = {
  ALL: 'All',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const PANEL_META = {
  overview: { title: 'Overview', subtitle: 'What needs your attention and how bookings are trending.' },
  bookings: { title: 'Bookings', subtitle: 'Review, approve, and manage every booking request.' },
  resources: { title: 'Resources', subtitle: 'Rooms, labs, and equipment available for booking.' },
  tickets: { title: 'Tickets', subtitle: 'Assign technicians and track issues through to resolution.' },
  users: { title: 'Users', subtitle: 'Manage accounts and access roles.' },
  calendar: { title: 'Calendar', subtitle: 'See resource availability across the schedule.' },
};

/* ---------- helpers ---------- */

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

// Never let one bad date crash the whole table.
function safeFormat(value, pattern, fallback = '—') {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : format(d, pattern);
}

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_TONES = [
  { bg: '#FFEDD5', fg: '#C2410C' },
  { bg: '#E0F2FE', fg: '#0369A1' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#EDE9FE', fg: '#6D28D9' },
  { bg: '#FEF9C3', fg: '#A16207' },
];

function toneFor(name) {
  const s = String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 997;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/* ---------- small presentational pieces ---------- */

function Avatar({ name, size = 32 }) {
  const tone = toneFor(name);
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, fontSize: size * 0.36, background: tone.bg, color: tone.fg }}
    >
      {initialsOf(name)}
    </span>
  );
}

function Skeleton({ className = '', style }) {
  return <div className={`ad-skeleton rounded-lg ${className}`} style={style} />;
}

function EmptyState({ icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span
        className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--primary)' }}
      >
        {icon}
      </span>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {hint && <p className="mt-1 max-w-xs text-xs" style={{ color: 'var(--text-secondary)' }}>{hint}</p>}
    </div>
  );
}

function Card({ children, className = '', style }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.96)', ...style }}
    >
      {children}
    </div>
  );
}

function CardTitle({ icon, children, aside }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {icon && <span style={{ color: 'var(--primary)' }}>{icon}</span>}
        {children}
      </h2>
      {aside}
    </div>
  );
}

/* ---------- main page ---------- */

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
      toast.error('Couldn’t load dashboard data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      const response = await bookingApi.approve(id);
      if (response?.data) {
        toast.success('Booking approved.');
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
        toast.success('Booking rejected.');
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
        toast.success('Booking cancelled.');
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
    if (!window.confirm('Permanently delete this booking? This can’t be undone.')) return;
    try {
      await bookingApi.deleteById(id);
      toast.success('Booking deleted.');
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
    if (sortField !== field) return <ChevronsUpDown size={12} style={{ opacity: 0.35 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  /* ---------- derived data ---------- */

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
  const pendingCount = stats.PENDING ?? pendingBookings.length;
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

  const pct = (n) => (totalCount ? Math.round((n / totalCount) * 100) : 0);
  const rejectionRate = pct(rejectedCount);
  const cancellationRate = pct(cancelledCount);
  const approvalRate = pct(approvedCount);
  const pendingRate = pct(stats.PENDING || 0);

  const sidebarLinks = [
    { label: 'Overview', icon: <LayoutDashboard size={17} />, value: 'overview' },
    { label: 'Bookings', icon: <BookOpen size={17} />, value: 'bookings', badge: pendingCount },
    { label: 'Resources', icon: <Package size={17} />, value: 'resources' },
    { label: 'Tickets', icon: <ClipboardList size={17} />, value: 'tickets' },
    { label: 'Users', icon: <Users size={17} />, value: 'users' },
    { label: 'Calendar', icon: <CalendarRange size={17} />, value: 'calendar' },
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
      const key = booking.resourceName || booking.resourceId || 'Unknown resource';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([resource, count]) => ({ resource, count }));
  })();
  const topResourceMax = Math.max(...topResources.map((r) => r.count), 1);

  const last7Days = (() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      data.push({
        date: d,
        label: format(d, 'EEE'),
        isToday: i === 0,
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
  const weeklyTotal = last7Days.reduce((sum, d) => sum + d.total, 0);

  const health = (() => {
    if (pendingRate >= 30 || rejectionRate >= 20) {
      return {
        level: 'Needs attention',
        color: 'var(--status-rejected)',
        bg: 'var(--status-rejected-bg)',
        note: pendingRate >= 30
          ? `${pendingRate}% of requests are still waiting for a decision.`
          : `${rejectionRate}% of requests are being rejected.`,
      };
    }
    if (pendingRate >= 15 || rejectionRate >= 10) {
      return {
        level: 'Watch closely',
        color: 'var(--status-pending)',
        bg: 'var(--status-pending-bg)',
        note: pendingRate >= 15
          ? `${pendingRate}% of requests are waiting — the queue is building up.`
          : `${rejectionRate}% of requests are being rejected.`,
      };
    }
    return {
      level: 'Healthy',
      color: 'var(--status-approved)',
      bg: 'var(--status-approved-bg)',
      note: 'The queue is under control and few requests are rejected.',
    };
  })();

  const statCards = [
    { label: 'Total requests', value: stats.TOTAL || 0, share: 100, icon: <Users size={18} />, color: 'var(--primary)', bg: 'rgba(249,115,22,0.10)' },
    { label: 'Pending', value: stats.PENDING || 0, share: pendingRate, icon: <Clock size={18} />, color: 'var(--status-pending)', bg: 'var(--status-pending-bg)' },
    { label: 'Approved', value: stats.APPROVED || 0, share: approvalRate, icon: <CheckSquare size={18} />, color: 'var(--status-approved)', bg: 'var(--status-approved-bg)' },
    { label: 'Rejected', value: stats.REJECTED || 0, share: rejectionRate, icon: <AlertCircle size={18} />, color: 'var(--status-rejected)', bg: 'var(--status-rejected-bg)' },
  ];

  const distribution = [
    { label: 'Approved', value: approvedCount, color: 'var(--status-approved)' },
    { label: 'Pending', value: stats.PENDING || 0, color: 'var(--status-pending)' },
    { label: 'Rejected', value: rejectedCount, color: 'var(--status-rejected)' },
    { label: 'Cancelled', value: cancelledCount, color: 'var(--status-cancelled, #94a3b8)' },
  ];

  const quickFacts = [
    { label: 'In use right now', value: activeNow, hint: 'Approved bookings in progress', icon: <Activity size={15} /> },
    { label: 'Resources booked', value: uniqueResources, hint: 'Distinct resources with bookings', icon: <Building2 size={15} /> },
    { label: 'Active requesters', value: uniqueUsers, hint: 'Unique people who have booked', icon: <UserCheck size={15} /> },
    { label: 'Average length', value: `${averageDurationHours.toFixed(1)}h`, hint: 'Typical booking duration', icon: <Timer size={15} /> },
  ];

  const managementSections = [
    {
      title: 'Booking approvals',
      detail: 'Review requests, handle cancellations, and keep policy outcomes consistent.',
      icon: <ShieldCheck size={18} />,
      cta: 'Go to bookings',
      onClick: () => switchPanel('bookings'),
    },
    {
      title: 'Ticket operations',
      detail: 'Assign technicians and move tickets through each stage to resolution.',
      icon: <ClipboardList size={18} />,
      cta: 'Go to tickets',
      onClick: () => switchPanel('tickets'),
    },
    {
      title: 'Access management',
      detail: 'Set account roles and keep access limited to what people need.',
      icon: <UserCog size={18} />,
      cta: 'Go to users',
      onClick: () => switchPanel('users'),
    },
  ];

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    background: 'var(--bg-section)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };
  const sortableTh = { ...thStyle, cursor: 'pointer' };

  const adminName = currentUser?.name || currentUser?.userName || currentUser?.username || 'Administrator';
  const adminEmail = currentUser?.email || '';
  const meta = PANEL_META[activePanel];

  /* ---------- render ---------- */

  return (
    <div className="admin-dashboard-shell min-h-screen w-full px-4 py-6 md:py-8" style={{ background: 'var(--bg-primary)' }}>
      <style>{`
        .ad-focus:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .ad-skeleton { background: linear-gradient(90deg, rgba(15,23,42,0.05) 25%, rgba(15,23,42,0.09) 37%, rgba(15,23,42,0.05) 63%); background-size: 400% 100%; animation: ad-shimmer 1.4s ease infinite; }
        @keyframes ad-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
        .ad-row-pending { box-shadow: inset 3px 0 0 var(--status-pending); }
        .ad-icon-btn { transition: transform 120ms ease, filter 120ms ease; }
        .ad-icon-btn:hover { transform: translateY(-1px); filter: brightness(0.96); }
        .ad-bar { transition: height 300ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .ad-skeleton { animation: none; }
          .ad-icon-btn, .ad-bar { transition: none; }
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-full">
        <div className="admin-dashboard-grid grid min-h-[calc(100vh-4rem)] gap-6">
          {/* ---------- sidebar ---------- */}
          <aside
            className="admin-sidebar flex flex-col rounded-3xl border p-4 lg:sticky lg:top-6 lg:self-start"
            style={{ borderColor: 'rgba(249,115,22,0.18)', background: 'linear-gradient(180deg, rgba(249,115,22,0.10), rgba(255,255,255,0.98) 40%)' }}
          >
            <div className="mb-5 flex items-center gap-3 px-1">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              >
                <ShieldCheck size={20} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  Admin console
                </h1>
                <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Campus resources
                </p>
              </div>
            </div>

            <nav className="admin-sidebar-nav" aria-label="Admin sections">
              {sidebarLinks.map((link) => {
                const active = activePanel === link.value;
                return (
                  <button
                    key={link.value}
                    onClick={() => switchPanel(link.value)}
                    aria-current={active ? 'page' : undefined}
                    className="admin-sidebar-btn ad-focus flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-left transition-colors"
                    style={{
                      background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-primary)',
                      border: '1px solid transparent',
                      boxShadow: active ? 'inset 3px 0 0 var(--primary)' : 'none',
                    }}
                  >
                    <span style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}>{link.icon}</span>
                    <span className="flex-1">{link.label}</span>
                    {link.badge > 0 && (
                      <span
                        className="inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                        style={{ background: 'var(--primary)', height: 20 }}
                        title={`${link.badge} pending`}
                      >
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border bg-white/80 p-3" style={{ borderColor: 'rgba(249,115,22,0.14)' }}>
              <Avatar name={adminName} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{adminName}</p>
                {adminEmail && <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{adminEmail}</p>}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="ad-focus ad-icon-btn rounded-lg p-2"
                style={{ color: 'var(--text-secondary)', background: 'rgba(15,23,42,0.04)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </aside>

          {/* ---------- content ---------- */}
          <main className="admin-content min-w-0">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {meta.title}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{meta.subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs sm:inline" style={{ color: 'var(--text-secondary)' }}>
                  {format(new Date(), 'EEEE, MMM d')}
                </span>
                {(activePanel === 'overview' || activePanel === 'bookings') && (
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="ad-focus inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
                    style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                )}
              </div>
            </header>

            {/* ===== overview ===== */}
            {activePanel === 'overview' && (
              <div className="grid gap-6">
                {/* Approval queue: the admin's main job */}
                <Card className="overflow-hidden">
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    style={{ background: pendingCount > 0 ? 'rgba(249,115,22,0.07)' : 'transparent', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: 'rgba(249,115,22,0.14)', color: 'var(--primary)' }}
                      >
                        <Inbox size={20} />
                      </span>
                      <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                          {loading
                            ? 'Checking the approval queue…'
                            : pendingCount === 0
                              ? 'Approval queue is clear'
                              : `${pendingCount} ${pendingCount === 1 ? 'booking needs' : 'bookings need'} a decision`}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Oldest requests are shown first so nobody waits longer than needed.
                        </p>
                      </div>
                    </div>
                    {pendingCount > 0 && (
                      <button
                        onClick={() => { switchPanel('bookings'); setFilter('PENDING'); }}
                        className="ad-focus inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-colors"
                        style={{ background: 'var(--primary)' }}
                      >
                        Review all <ArrowRight size={14} />
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="space-y-3 p-5">
                      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : pendingBookings.length === 0 ? (
                    <EmptyState
                      icon={<CheckCircle size={22} />}
                      title="Nothing waiting on you"
                      hint="New booking requests will show up here as soon as they come in."
                    />
                  ) : (
                    <ul>
                      {[...pendingBookings]
                        .sort((a, b) => getBookingSortTimestamp(a) - getBookingSortTimestamp(b))
                        .slice(0, 5)
                        .map((b, idx, arr) => (
                          <li
                            key={b.id}
                            className="flex flex-wrap items-center gap-3 px-5 py-3"
                            style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                          >
                            <Avatar name={b.userName} />
                            <div className="min-w-0 flex-1" style={{ flexBasis: 220 }}>
                              <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {b.userName || 'Unknown user'}
                                <span className="font-normal" style={{ color: 'var(--text-secondary)' }}> wants </span>
                                {b.resourceName || 'a resource'}
                              </p>
                              <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {safeFormat(b.startTime, 'MMM d, hh:mm a')} – {safeFormat(b.endTime, 'hh:mm a')}
                                {b.purpose ? ` · ${b.purpose}` : ''}
                              </p>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {getBookingSortTimestamp(b) > 0
                                ? `Requested ${formatDistanceToNow(new Date(getBookingSortTimestamp(b)), { addSuffix: true })}`
                                : ''}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(b.id)}
                                className="ad-focus ad-icon-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                                style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved)', border: '1px solid var(--status-approved-border)' }}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={() => setRejectModal(b)}
                                className="ad-focus ad-icon-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                                style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected)', border: '1px solid var(--status-rejected-border)' }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </Card>

                {/* KPI cards */}
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Booking totals">
                  {statCards.map((card) => (
                    <Card key={card.label} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{card.label}</p>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: card.bg, color: card.color }}>
                          {card.icon}
                        </span>
                      </div>
                      {loading ? (
                        <Skeleton className="mt-3 h-9 w-20" />
                      ) : (
                        <p className="mt-2 text-3xl font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {card.value}
                        </p>
                      )}
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(15,23,42,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${card.share}%`, background: card.color }} />
                      </div>
                      <p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {card.label === 'Total requests' ? 'All time' : `${card.share}% of all requests`}
                      </p>
                    </Card>
                  ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  {/* Left: trend + distribution */}
                  <Card className="p-5">
                    <CardTitle
                      aside={<span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{weeklyTotal} requests in 7 days</span>}
                    >
                      Requests this week
                    </CardTitle>

                    {loading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="flex items-end gap-2 sm:gap-3" role="img" aria-label="Bar chart of booking requests created in the last 7 days">
                        {last7Days.map((day) => {
                          const h = Math.max(6, Math.round((day.total / weeklyPeak) * 100));
                          return (
                            <div key={day.label + day.date.toISOString()} className="flex-1 text-center" title={`${format(day.date, 'EEE, MMM d')}: ${day.total} requests`}>
                              <p className="mb-1 text-xs font-semibold tabular-nums" style={{ color: day.total ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {day.total}
                              </p>
                              <div className="mx-auto flex h-32 w-full items-end rounded-lg" style={{ background: 'rgba(15,23,42,0.04)' }}>
                                <div
                                  className="ad-bar w-full rounded-lg"
                                  style={{
                                    height: `${h}%`,
                                    background: day.isToday ? 'var(--primary)' : 'rgba(249,115,22,0.35)',
                                  }}
                                />
                              </div>
                              <p className="mt-2 text-xs" style={{ color: day.isToday ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: day.isToday ? 700 : 500 }}>
                                {day.isToday ? 'Today' : day.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
                      <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Where requests end up</p>
                      <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(15,23,42,0.06)' }}>
                        {distribution.map((seg) => (
                          seg.value > 0 && (
                            <div
                              key={seg.label}
                              title={`${seg.label}: ${seg.value}`}
                              style={{ width: `${(seg.value / Math.max(totalCount, 1)) * 100}%`, background: seg.color }}
                            />
                          )
                        ))}
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                        {distribution.map((seg) => (
                          <li key={seg.label} className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
                            {seg.label}
                            <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{seg.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>

                  {/* Right: health + top resources */}
                  <div className="grid content-start gap-6">
                    <Card className="p-5">
                      <CardTitle>Queue health</CardTitle>
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
                          style={{ background: health.bg, color: health.color }}
                        >
                          {health.level}
                        </span>
                      </div>
                      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{health.note}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-3" style={{ background: 'var(--bg-section)' }}>
                          <dt className="text-xs" style={{ color: 'var(--text-secondary)' }}>Busiest start time</dt>
                          <dd className="mt-1 text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                            {String(peakHour.hour).padStart(2, '0')}:00
                          </dd>
                          <dd className="text-xs" style={{ color: 'var(--text-secondary)' }}>{peakHour.volume} requests</dd>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: 'var(--bg-section)' }}>
                          <dt className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cancellations</dt>
                          <dd className="mt-1 text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{cancellationRate}%</dd>
                          <dd className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cancelledCount} bookings</dd>
                        </div>
                      </dl>
                    </Card>

                    <Card className="p-5">
                      <CardTitle icon={<CalendarRange size={15} />}>Most booked resources</CardTitle>
                      {loading ? (
                        <div className="space-y-3">
                          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                      ) : topResources.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          No bookings yet. Demand will appear here once requests come in.
                        </p>
                      ) : (
                        <ol className="space-y-3">
                          {topResources.map((r) => (
                            <li key={r.resource}>
                              <div className="mb-1 flex items-baseline justify-between gap-3">
                                <span className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.resource}</span>
                                <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>{r.count}</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(15,23,42,0.06)' }}>
                                <div className="h-full rounded-full" style={{ width: `${(r.count / topResourceMax) * 100}%`, background: 'var(--primary)' }} />
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </Card>
                  </div>
                </section>

                {/* Quick facts */}
                <Card className="grid divide-y sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4" style={{ overflow: 'hidden' }}>
                  {quickFacts.map((fact, i) => (
                    <div
                      key={fact.label}
                      className="p-4"
                      style={{ borderLeft: i > 0 ? '1px solid var(--border)' : 'none', borderColor: 'var(--border)' }}
                    >
                      <p className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--primary)' }}>{fact.icon}</span>
                        {fact.label}
                      </p>
                      {loading ? (
                        <Skeleton className="mt-2 h-7 w-14" />
                      ) : (
                        <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fact.value}</p>
                      )}
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{fact.hint}</p>
                    </div>
                  ))}
                </Card>

                {/* Shortcuts */}
                <section className="grid gap-4 md:grid-cols-3" aria-label="Shortcuts">
                  {managementSections.map((section) => (
                    <button
                      key={section.title}
                      onClick={section.onClick}
                      className="ad-focus group rounded-2xl border p-5 text-left transition-colors hover:bg-white"
                      style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.7)' }}
                    >
                      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--primary)' }}>
                        {section.icon}
                      </span>
                      <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{section.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.detail}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                        {section.cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  ))}
                </section>
              </div>
            )}

            {/* ===== embedded panels ===== */}
            {activePanel === 'resources' && <section><ResourcePage /></section>}
            {activePanel === 'tickets' && <section><AdminPanelPage /></section>}
            {activePanel === 'users' && <section><UserManagement /></section>}
            {activePanel === 'calendar' && <section><ResourceCalendarPage /></section>}

            {/* ===== bookings ===== */}
            {activePanel === 'bookings' && (
              <section>
                <Card className="p-4 md:p-5">
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                      <Search size={16} className="pointer-events-none absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by resource, person, or purpose"
                        aria-label="Search bookings"
                        className="ad-focus w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                      />
                    </div>

                    <div
                      className="inline-flex flex-wrap gap-1 rounded-xl p-1"
                      role="tablist"
                      aria-label="Filter by status"
                      style={{ background: 'rgba(15,23,42,0.04)' }}
                    >
                      {FILTER_OPTIONS.map(f => {
                        const active = filter === f;
                        const count = f === 'ALL' ? bookings.length : bookings.filter(b => b.status === f).length;
                        return (
                          <button
                            key={f}
                            role="tab"
                            aria-selected={active}
                            onClick={() => setFilter(f)}
                            className="ad-focus inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                            style={{
                              background: active ? 'white' : 'transparent',
                              color: active ? 'var(--primary)' : 'var(--text-secondary)',
                              boxShadow: active ? '0 1px 3px rgba(15,23,42,0.12)' : 'none',
                            }}
                          >
                            {FILTER_LABELS[f]}
                            <span
                              className="rounded-full px-1.5 tabular-nums"
                              style={{
                                background: active ? 'rgba(249,115,22,0.12)' : 'rgba(15,23,42,0.06)',
                                fontSize: 11,
                              }}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {loading ? (
                    <div className="space-y-2 py-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                      <div className="overflow-x-auto" style={{ maxHeight: '68vh' }}>
                        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                          <thead>
                            <tr>
                              <th style={sortableTh} onClick={() => handleSort('id')}><span className="flex items-center gap-1">Reference<SortIcon field="id" /></span></th>
                              <th style={sortableTh} onClick={() => handleSort('resourceName')}><span className="flex items-center gap-1">Resource<SortIcon field="resourceName" /></span></th>
                              <th style={sortableTh} onClick={() => handleSort('userName')}><span className="flex items-center gap-1">Requested by<SortIcon field="userName" /></span></th>
                              <th style={sortableTh} onClick={() => handleSort('startTime')}><span className="flex items-center gap-1">Time slot<SortIcon field="startTime" /></span></th>
                              <th style={thStyle}>Purpose</th>
                              <th style={sortableTh} onClick={() => handleSort('status')}><span className="flex items-center gap-1">Status<SortIcon field="status" /></span></th>
                              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr>
                                <td colSpan={7}>
                                  <EmptyState
                                    icon={<SearchX size={22} />}
                                    title="No bookings match your filters"
                                    hint="Try a different status or clear the search box."
                                  />
                                </td>
                              </tr>
                            ) : filtered.map((b) => (
                              <tr
                                key={b.id}
                                className={`transition-colors hover:bg-orange-50/60 ${b.status === 'PENDING' ? 'ad-row-pending' : ''}`}
                                style={{ background: 'white' }}
                              >
                                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(15,23,42,0.05)' }} className="text-xs font-mono">
                                  {bookingReferences[b.id]}
                                </td>
                                <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{b.resourceName}</p>
                                </td>
                                <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                                  <div className="flex items-center gap-2.5">
                                    <Avatar name={b.userName} size={28} />
                                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{b.userName}</p>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15,23,42,0.05)', whiteSpace: 'nowrap' }}>
                                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{safeFormat(b.startTime, 'MMM d, yyyy')}</p>
                                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {safeFormat(b.startTime, 'hh:mm a')} – {safeFormat(b.endTime, 'hh:mm a')}
                                  </p>
                                </td>
                                <td style={{ padding: '14px 16px', maxWidth: 280, minWidth: 220, borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                                  <p
                                    className="text-xs leading-5 whitespace-normal break-words"
                                    style={{ color: 'var(--text-secondary)' }}
                                    title={b.purpose || 'No purpose provided'}
                                  >
                                    {b.purpose || 'No purpose provided'}
                                  </p>
                                  {b.status === 'REJECTED' && b.rejectionReason && (
                                    <p className="mt-1 text-xs" style={{ color: 'var(--status-rejected)' }} title={b.rejectionReason}>
                                      Reason: {b.rejectionReason.substring(0, 40)}{b.rejectionReason.length > 40 ? '…' : ''}
                                    </p>
                                  )}
                                </td>
                                <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                                  <StatusBadge status={b.status} size="sm" />
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                                  <div className="flex items-center justify-end gap-2">
                                    {b.status === 'PENDING' && (
                                      <>
                                        <button
                                          onClick={() => handleApprove(b.id)}
                                          title="Approve"
                                          aria-label={`Approve booking ${bookingReferences[b.id] || ''}`}
                                          className="ad-focus ad-icon-btn rounded-lg p-1.5"
                                          style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved)', border: '1px solid var(--status-approved-border)' }}
                                        >
                                          <CheckCircle size={16} />
                                        </button>
                                        <button
                                          onClick={() => setRejectModal(b)}
                                          title="Reject"
                                          aria-label={`Reject booking ${bookingReferences[b.id] || ''}`}
                                          className="ad-focus ad-icon-btn rounded-lg p-1.5"
                                          style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected)', border: '1px solid var(--status-rejected-border)' }}
                                        >
                                          <XCircle size={16} />
                                        </button>
                                      </>
                                    )}
                                    {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                                      <button
                                        onClick={() => handleCancel(b.id)}
                                        title="Cancel booking"
                                        aria-label={`Cancel booking ${bookingReferences[b.id] || ''}`}
                                        className="ad-focus ad-icon-btn rounded-lg p-1.5"
                                        style={{ background: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled)', border: '1px solid var(--status-cancelled-border)' }}
                                      >
                                        <Ban size={16} />
                                      </button>
                                    )}
                                    {(b.status === 'REJECTED' || b.status === 'CANCELLED') && (
                                      <button
                                        onClick={() => handleDelete(b.id)}
                                        title="Delete permanently"
                                        aria-label={`Delete booking ${bookingReferences[b.id] || ''}`}
                                        className="ad-focus ad-icon-btn rounded-lg p-1.5"
                                        style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}
                                      >
                                        <Trash2 size={16} />
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
                        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Showing {filtered.length} of {bookings.length} bookings
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
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
