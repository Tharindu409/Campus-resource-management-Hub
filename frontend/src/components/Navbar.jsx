import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  User,
  Users,
  Shield,
  Wrench,
  ClipboardList,
  LogOut,
  Package,
} from 'lucide-react';
import NotificationBell from './notifications/NotificationBell';

export default function Navbar() {
  const { currentUser } = useUser();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = currentUser?.role || '';
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const isTechnician = role === 'TECHNICIAN' || role === 'ROLE_TECHNICIAN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToDashboard = () => {
    navigate(isAdmin ? '/admin-dashboard' : '/dashboard');
  };

  const userLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/create', icon: <PlusCircle size={16} />, label: 'Booking' },
    { to: '/my-bookings', icon: <BookOpen size={16} />, label: 'Bookings' },
    { to: '/resources', icon: <Package size={16} />, label: 'Resources' },
    { to: '/create-ticket', icon: <Wrench size={16} />, label: 'Ticket' },
    { to: '/my-tickets', icon: <ClipboardList size={16} />, label: 'Tickets' },
    { to: '/calendar', icon: <CalendarDays size={16} />, label: 'Calendar' },
  ];

  const adminLinks = [
    { to: '/admin-dashboard', icon: <LayoutDashboard size={16} />, label: 'Overview' },
    { to: '/admin-dashboard?tab=bookings', icon: <BookOpen size={16} />, label: 'Bookings' },
    { to: '/resources', icon: <Package size={16} />, label: 'Resources' },
    { to: '/admin', icon: <Shield size={16} />, label: 'Tickets' },
    { to: '/users', icon: <Users size={16} />, label: 'Users' },
    { to: '/calendar', icon: <CalendarDays size={16} />, label: 'Calendar' },
  ];

  const technicianLinks = [
    { to: '/technician', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/technician', icon: <Wrench size={16} />, label: 'Tech Workspace' },
  ];

  const links = useMemo(() => {
    if (isAdmin) return adminLinks;

    if (isTechnician) {
      return technicianLinks;
    }

    return userLinks;
  }, [isAdmin, isTechnician]);

  const dashboardTab = new URLSearchParams(location.search).get('tab');

  const isLinkActive = (path) => {
    if (path === '/admin-dashboard') {
      return location.pathname === '/admin-dashboard' && dashboardTab !== 'bookings';
    }

    if (path === '/admin-dashboard?tab=bookings') {
      return location.pathname === '/admin-dashboard' && dashboardTab === 'bookings';
    }

    return location.pathname === path;
  };

  const userLabel = currentUser?.userName || currentUser?.email || 'Account';
  const roleLabel = isAdmin ? 'Admin' : isTechnician ? 'Technician' : 'User';

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            to={isAdmin ? '/admin-dashboard' : '/dashboard'}
            className="flex items-center justify-between gap-3 shrink-0"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                }}
              >
                <CalendarDays size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                  SmartCampus
                </p>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {roleLabel} workspace
                </p>
              </div>
            </div>
          </Link>

          <div
            className="flex items-center gap-1 p-1 rounded-2xl overflow-x-auto custom-scrollbar lg:flex-1 lg:justify-center"
            style={{
              background: 'rgba(255,255,255,0.78)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
            }}
          >
            {links.map((link) => {
              const active = isLinkActive(link.to);

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: active ? 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(251,146,60,0.08))' : 'transparent',
                    color: active ? 'var(--primary-hover)' : 'var(--text-secondary)',
                    border: active
                      ? '1px solid rgba(249,115,22,0.28)'
                      : '1px solid transparent',
                  }}
                >
                  {link.icon}
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 shrink-0 lg:justify-end">
            <NotificationBell />

            <button
              onClick={goToDashboard}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.86)',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                color: 'var(--text-primary)',
              }}
            >
              <User size={14} />
              <span className="text-xs hidden sm:inline max-w-36 truncate">
                {userLabel}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.16), rgba(234,88,12,0.12))',
                color: 'var(--primary-hover)',
                border: '1px solid rgba(249,115,22,0.22)',
              }}
            >
              <LogOut size={14} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}