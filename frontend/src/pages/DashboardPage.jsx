import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import { bookingApi } from '../api/bookingApi';
import { getCurrentUserId, ticketService } from '../api/ticketService';
import { useNavigate } from 'react-router-dom';
import {
  FaTicketAlt,
  FaCalendarCheck,
  FaBell,
  FaUserShield,
  FaGithub,
  FaGoogle,
  FaCheckCircle,
} from 'react-icons/fa';
import { ArrowRight, Sparkles, CalendarClock, Activity, Gauge } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin, isTechnician } = useAuth();
  const { currentUser } = useUser();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const loadBookingCount = async () => {
      if (!currentUser?.userId) {
        setBookingCount(0);
        return;
      }

      try {
        const res = await bookingApi.getMyBookings(currentUser.userId);
        const items = Array.isArray(res.data) ? res.data : [];
        setBookings(items);
        setBookingCount(items.length);
      } catch {
        setBookings([]);
        setBookingCount(0);
      }
    };

    loadBookingCount();
  }, [currentUser?.userId]);

  useEffect(() => {
    const loadTicketCount = async () => {
      const currentUserId = currentUser?.userId || getCurrentUserId();
      if (!currentUserId) {
        setTicketCount(0);
        return;
      }

      try {
        const data = await ticketService.getMyTickets(currentUserId);
        const items = Array.isArray(data) ? data : [];
        setTickets(items);
        setTicketCount(items.length);
      } catch {
        setTickets([]);
        setTicketCount(0);
      }
    };

    loadTicketCount();
  }, [currentUser?.userId]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBadge = () => {
    if (isAdmin()) return { label: 'Admin', color: 'bg-red-500' };
    if (isTechnician()) return { label: 'Technician', color: 'bg-blue-500' };
    return { label: 'User', color: 'bg-green-500' };
  };

  const displayName = user?.name || currentUser?.userName || 'Campus User';
  const displayEmail = user?.email || currentUser?.email || 'Not available';
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U';
  const displayRoles = user?.roles?.length ? user.roles : [`ROLE_${getRoleBadge().label.toUpperCase()}`];
  const firstName = displayName?.split(' ')?.[0] || 'User';

  const now = new Date();

  const normalizedBookings = bookings
    .map((booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return {
        ...booking,
        start,
        end,
      };
    })
    .filter((booking) => !Number.isNaN(booking.start?.getTime()));

  const upcomingBookings = normalizedBookings
    .filter((booking) => booking.start >= now && !['REJECTED', 'CANCELLED'].includes(booking.status))
    .sort((a, b) => a.start - b.start)
    .slice(0, 5);

  const activeBookingsCount = normalizedBookings.filter((booking) => ['PENDING', 'APPROVED'].includes(booking.status)).length;
  const approvedBookingsCount = normalizedBookings.filter((booking) => booking.status === 'APPROVED').length;
  const bookingCompletionRate = bookingCount > 0 ? Math.round((approvedBookingsCount / bookingCount) * 100) : 0;

  const normalizedTickets = tickets.map((ticket) => ({
    ...ticket,
    status: String(ticket.status || 'OPEN').toUpperCase(),
    createdAtValue: ticket.createdAt ? new Date(ticket.createdAt) : null,
  }));

  const openTicketCount = normalizedTickets.filter((ticket) => ['OPEN', 'PENDING', 'IN_PROGRESS', 'ASSIGNED', 'NEW'].includes(ticket.status)).length;
  const resolvedTicketCount = normalizedTickets.filter((ticket) => ['RESOLVED', 'CLOSED', 'DONE'].includes(ticket.status)).length;
  const ticketResolutionRate = ticketCount > 0 ? Math.round((resolvedTicketCount / ticketCount) * 100) : 0;

  const latestTickets = [...normalizedTickets]
    .sort((a, b) => {
      const aTime = a.createdAtValue?.getTime?.() || 0;
      const bTime = b.createdAtValue?.getTime?.() || 0;
      return bTime - aTime;
    })
    .slice(0, 4);

  const roleStrength = displayRoles.length;
  const engagementScore = Math.min(100, 35 + bookingCount * 6 + ticketCount * 4 + unreadCount * 2);
  const productivityScore = Math.round((bookingCompletionRate * 0.55) + (ticketResolutionRate * 0.45));

  const kpiCards = [
    {
      title: 'Active Bookings',
      value: activeBookingsCount,
      subtitle: `${bookingCount} total this cycle`,
      icon: <FaCalendarCheck size={18} style={{ color: 'var(--primary)' }} />,
      onClick: () => navigate('/my-bookings'),
    },
    {
      title: 'Open Tickets',
      value: openTicketCount,
      subtitle: `${resolvedTicketCount} resolved`,
      icon: <FaTicketAlt size={18} style={{ color: 'var(--primary)' }} />,
      onClick: () => navigate('/my-tickets'),
    },
    {
      title: 'Alerts Queue',
      value: unreadCount,
      subtitle: unreadCount > 0 ? 'Needs your attention' : 'All clear right now',
      icon: <FaBell size={18} style={{ color: 'var(--primary)' }} />,
      onClick: () => navigate('/notifications'),
    },
    {
      title: 'Access Layers',
      value: roleStrength,
      subtitle: 'Assigned permissions',
      icon: <FaUserShield size={18} style={{ color: 'var(--primary)' }} />,
      onClick: () => setShowProfile(true),
    },
  ];

  return (
    <div className="min-h-screen page-enter" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {showProfile ? 'My Profile' : 'Dashboard'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(new Date())}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                !showProfile
                  ? 'text-white border'
                  : 'text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              style={{
                background: !showProfile ? 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' : 'transparent',
                borderColor: !showProfile ? 'var(--accent-mid)' : 'rgba(148, 163, 184, 0.25)',
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                showProfile
                  ? 'text-white border'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={{
                background: showProfile ? 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' : 'transparent',
                color: showProfile ? 'white' : 'var(--text-primary)',
                borderColor: showProfile ? 'var(--accent-mid)' : 'rgba(148, 163, 184, 0.25)',
              }}
            >
              Profile
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors inline-flex items-center gap-2"
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                borderColor: 'rgba(148, 163, 184, 0.25)',
                color: 'var(--text-primary)',
              }}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-5 text-center" style={{ background: 'var(--accent-start)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showProfile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}>
                <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-28 translate-x-24"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-20 -translate-x-20"></div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="w-20 h-20 rounded-2xl ring-4 ring-white/30 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">{initial}</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold truncate">{displayName}</h2>
                    <p className="text-white/80 text-sm mt-1 truncate">{displayEmail}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {displayRoles.map((role) => (
                        <span
                          key={role}
                          className="text-xs px-3 py-1 rounded-full font-semibold"
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.35)',
                          }}
                        >
                          {role.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 border glass-card" style={{ borderColor: 'rgba(148, 163, 184, 0.25)' }}>
                <h3 className="font-bold text-base mb-5" style={{ color: 'var(--text-primary)' }}>Account Overview</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Email Address</p>
                    <p className="text-sm font-semibold break-all" style={{ color: 'var(--text-primary)' }}>{displayEmail}</p>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Account Status</p>
                    <span className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: 'var(--accent-end)' }}>
                      <FaCheckCircle size={12} />
                      Active
                    </span>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Sign In Method</p>
                    {user?.provider === 'google' ? (
                      <span className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <FaGoogle size={12} />
                        Google
                      </span>
                    ) : user?.githubUsername ? (
                      <span className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <FaGithub size={12} />
                        @{user.githubUsername}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Local Account</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl p-5 border glass-card" style={{ borderColor: 'rgba(148, 163, 184, 0.25)' }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Profile Highlights</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'rgba(249, 115, 22, 0.08)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bookings</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{bookingCount}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'rgba(15, 23, 42, 0.06)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tickets</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{ticketCount}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'rgba(251, 146, 60, 0.12)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Unread Alerts</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{unreadCount}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5 border glass-card" style={{ borderColor: 'rgba(148, 163, 184, 0.25)' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: 'rgba(255,255,255,0.78)', color: 'var(--text-primary)', border: '1px solid rgba(148, 163, 184, 0.2)' }}
                  >
                    View My Bookings
                  </button>
                  <button
                    onClick={() => navigate('/my-tickets')}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: 'rgba(255,255,255,0.78)', color: 'var(--text-primary)', border: '1px solid rgba(148, 163, 184, 0.2)' }}
                  >
                    View My Tickets
                  </button>
                  <button
                    onClick={() => navigate('/notifications')}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: 'rgba(255,255,255,0.78)', color: 'var(--text-primary)', border: '1px solid rgba(148, 163, 184, 0.2)' }}
                  >
                    Open Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 45%, #9a3412 100%)' }}>
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-32 translate-x-28" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/10 rounded-full translate-y-28 -translate-x-16" />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                  <p className="text-white/80 text-sm inline-flex items-center gap-2 mb-2">
                    <Sparkles size={14} /> {getGreeting()}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                    Welcome back, {firstName}. Your workspace is running strong.
                  </h2>
                  <p className="text-white/80 text-sm mt-2 max-w-2xl">
                    Track booking momentum, ticket resolution, and operational attention from one mature command center.
                  </p>
                </div>

                <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={displayName}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/40"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/25 ring-2 ring-white/35 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">{initial}</span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-white/75 truncate">{displayEmail}</p>
                    </div>
                  </div>

                  <p className="text-xs uppercase tracking-wide text-white/75">Current Productivity</p>
                  <p className="text-3xl font-bold mt-1">{Number.isFinite(productivityScore) ? productivityScore : 0}%</p>
                  <div className="w-full h-2 rounded-full bg-white/25 mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Number.isFinite(productivityScore) ? productivityScore : 0}%`, background: 'rgba(255,255,255,0.95)' }}
                    />
                  </div>
                  <p className="text-xs mt-2 text-white/75">Based on booking approvals and ticket closures.</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpiCards.map((card) => (
                <button
                  key={card.title}
                  onClick={card.onClick}
                  className="rounded-2xl p-5 border text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg glass-card"
                  style={{ borderColor: 'rgba(148, 163, 184, 0.22)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249, 115, 22, 0.12)' }}>
                      {card.icon}
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{card.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{card.subtitle}</p>
                </button>
              ))}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-8 space-y-5">
                <div className="rounded-2xl p-5 border glass-card" style={{ borderColor: 'rgba(148, 163, 184, 0.22)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base inline-flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <CalendarClock size={16} /> Upcoming Bookings Timeline
                    </h3>
                    <button
                      onClick={() => navigate('/create-booking')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(249,115,22,0.14)', color: 'var(--primary-hover)' }}
                    >
                      Create Booking
                    </button>
                  </div>

                  {upcomingBookings.length === 0 ? (
                    <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.62)', border: '1px dashed rgba(148, 163, 184, 0.35)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No upcoming bookings scheduled</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Create a new reservation to start your schedule.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(148, 163, 184, 0.2)' }}
                        >
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{booking.resourceName || 'Resource Booking'}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {booking.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {booking.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                              {booking.purpose || 'No purpose provided'}
                            </p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved)', border: '1px solid var(--status-approved-border)' }}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl p-5 border glass-card" style={{ borderColor: 'rgba(148, 163, 184, 0.22)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base inline-flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Activity size={16} /> Ticket Operations Feed
                    </h3>
                    <button
                      onClick={() => navigate('/create-ticket')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(15, 23, 42, 0.08)', color: 'var(--text-primary)' }}
                    >
                      New Ticket
                    </button>
                  </div>

                  {latestTickets.length === 0 ? (
                    <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.62)', border: '1px dashed rgba(148, 163, 184, 0.35)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No tickets logged yet</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>When incidents are reported, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {latestTickets.map((ticket) => (
                        <div key={ticket.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.category || 'General Issue'}</p>
                              <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{ticket.description || 'No description available'}</p>
                            </div>
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--primary-hover)' }}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-4 space-y-5">
                <div className="rounded-2xl p-5 border glass-card" style={{ borderColor: 'rgba(148, 163, 184, 0.22)' }}>
                  <h3 className="font-bold text-base inline-flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                    <Gauge size={16} /> Performance Snapshot
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>Booking Completion</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bookingCompletionRate}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'rgba(148, 163, 184, 0.2)' }}>
                        <div className="h-2 rounded-full" style={{ width: `${bookingCompletionRate}%`, background: 'linear-gradient(90deg, var(--accent-start), var(--accent-end))' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>Ticket Resolution</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ticketResolutionRate}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'rgba(148, 163, 184, 0.2)' }}>
                        <div className="h-2 rounded-full" style={{ width: `${ticketResolutionRate}%`, background: 'linear-gradient(90deg, #0ea5e9, #0284c7)' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>Engagement Score</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{engagementScore}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'rgba(148, 163, 184, 0.2)' }}>
                        <div className="h-2 rounded-full" style={{ width: `${engagementScore}%`, background: 'linear-gradient(90deg, #14b8a6, #0d9488)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-5 border glass-card" style={{ borderColor: 'rgba(148, 163, 184, 0.22)' }}>
                  <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Role & Access Matrix</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {displayRoles.map((role) => (
                      <span
                        key={role}
                        className="text-xs px-3 py-1 rounded-full font-semibold"
                        style={{ background: 'rgba(15, 23, 42, 0.08)', color: 'var(--text-primary)', border: '1px solid rgba(148, 163, 184, 0.22)' }}
                      >
                        {role.replace('ROLE_', '')}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/create')}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--primary-hover)', border: '1px solid rgba(249,115,22,0.2)' }}
                    >
                      Book a Campus Resource
                    </button>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: 'rgba(255,255,255,0.78)', color: 'var(--text-primary)', border: '1px solid rgba(148, 163, 184, 0.22)' }}
                    >
                      Open Resource Calendar
                    </button>
                    <button
                      onClick={() => setShowProfile(true)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: 'rgba(255,255,255,0.78)', color: 'var(--text-primary)', border: '1px solid rgba(148, 163, 184, 0.22)' }}
                    >
                      Manage My Profile
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}