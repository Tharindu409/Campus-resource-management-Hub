import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Users,
  Shield,
  Wrench,
  ClipboardList,
  LogOut,
  Package,
} from 'lucide-react';
import NotificationBell from './notifications/NotificationBell';
import logoMark from '../assets/logo/smart-campus-logo.jpg';

const ICON = 16;

const USER_LINKS = [
  { to: '/dashboard', icon: <LayoutDashboard size={ICON} />, label: 'Dashboard' },
  { to: '/create', icon: <PlusCircle size={ICON} />, label: 'New booking' },
  { to: '/my-bookings', icon: <BookOpen size={ICON} />, label: 'My bookings' },
  { to: '/resources', icon: <Package size={ICON} />, label: 'Resources' },
  { to: '/create-ticket', icon: <Wrench size={ICON} />, label: 'New ticket' },
  { to: '/my-tickets', icon: <ClipboardList size={ICON} />, label: 'My tickets' },
  { to: '/calendar', icon: <CalendarDays size={ICON} />, label: 'Calendar' },
];

const ADMIN_LINKS = [
  { to: '/admin-dashboard', icon: <LayoutDashboard size={ICON} />, label: 'Overview' },
  { to: '/admin-dashboard?tab=bookings', icon: <BookOpen size={ICON} />, label: 'Bookings' },
  { to: '/resources', icon: <Package size={ICON} />, label: 'Resources' },
  { to: '/admin', icon: <Shield size={ICON} />, label: 'Tickets' },
  { to: '/users', icon: <Users size={ICON} />, label: 'Users' },
  { to: '/calendar', icon: <CalendarDays size={ICON} />, label: 'Calendar' },
];

const TECHNICIAN_LINKS = [
  { to: '/technician', icon: <Wrench size={ICON} />, label: 'Workspace' },
];

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
    if (isTechnician) navigate('/technician');
    else navigate(isAdmin ? '/admin-dashboard' : '/dashboard');
  };

  const links = useMemo(() => {
    if (isAdmin) return ADMIN_LINKS;
    if (isTechnician) return TECHNICIAN_LINKS;
    return USER_LINKS;
  }, [isAdmin, isTechnician]);

  const dashboardTab = new URLSearchParams(location.search).get('tab');

  const isLinkActive = (path) => {
    if (path === '/admin-dashboard') {
      return location.pathname === '/admin-dashboard' && dashboardTab !== 'bookings';
    }
    if (path === '/admin-dashboard?tab=bookings') {
      return location.pathname === '/admin-dashboard' && dashboardTab === 'bookings';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const userLabel = currentUser?.userName || currentUser?.email || 'Account';
  const roleLabel = isAdmin ? 'Admin' : isTechnician ? 'Technician' : 'Student';

  return (
    <header
      className="sticky top-0 z-50 w-full overflow-x-clip"
      style={{
        background: 'rgba(255,255,255,0.86)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border, rgba(148,163,184,0.25))',
      }}
    >
      <style>{`
        .nb-focus:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .nb-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .nb-scroll::-webkit-scrollbar { display: none; }
        .nb-link { position: relative; transition: color 120ms ease, background-color 120ms ease; }
        .nb-link:hover { background: rgba(249,115,22,0.07); }
        .nb-link[aria-current="page"]::after {
          content: ''; position: absolute; left: 10px; right: 10px; bottom: -9px;
          height: 3px; border-radius: 3px 3px 0 0; background: var(--primary);
        }
        @media (max-width: 1279px) {
          .nb-link[aria-current="page"]::after { bottom: -1px; }
        }
        @media (prefers-reduced-motion: reduce) { .nb-link { transition: none; } }
      `}</style>

      <div className="mx-auto max-w-7xl px-4">
        {/* Row 1: brand, (xl+) links, actions */}
        <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Link
            to={isAdmin ? '/admin-dashboard' : isTechnician ? '/technician' : '/dashboard'}
            className="nb-focus col-start-1 flex items-center gap-3 rounded-xl"
            aria-label="Smart Campus Resources Hub home"
          >
            <img
              src={logoMark}
              alt=""
              className="h-11 w-auto shrink-0"
              draggable={false}
            />
            <span className="hidden leading-tight sm:block">
              <span className="block text-base font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Smart Campus
              </span>
              <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
                {roleLabel} workspace
              </span>
            </span>
          </Link>

          {/* Desktop links: xl and up only. min-w-0 lets this shrink instead of pushing the buttons off-screen. */}
          <nav
            aria-label="Main"
            className="nb-scroll col-start-2 hidden h-full min-w-0 items-center justify-center gap-0.5 overflow-x-auto xl:flex"
          >
            {links.map((link) => {
              const active = isLinkActive(link.to);
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className="nb-link nb-focus flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold"
                  style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions always stay fully visible */}
          <div className="col-start-3 flex items-center gap-2">
            <NotificationBell />

            <button
              onClick={goToDashboard}
              className="nb-focus flex items-center gap-2.5 rounded-xl border p-1.5 transition-colors hover:bg-orange-50 sm:pr-3 xl:pr-1.5"
              style={{ borderColor: 'var(--border, rgba(148,163,184,0.3))', background: 'white', color: 'var(--text-primary)' }}
              title={`${userLabel} · ${roleLabel}`}
              aria-label={`${userLabel}, ${roleLabel}. Go to dashboard`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary, #EA580C))' }}
              >
                {userLabel?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              {/* Name is shown between sm and xl; at xl the links need the room, so avatar only */}
              <span className="hidden text-left leading-tight sm:block xl:hidden">
                <span className="block max-w-32 truncate text-sm font-semibold">{userLabel}</span>
                <span className="block text-[11px]" style={{ color: 'var(--text-secondary)' }}>{roleLabel}</span>
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="nb-focus flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-orange-50"
              style={{ borderColor: 'var(--border, rgba(148,163,184,0.3))', background: 'white', color: 'var(--text-secondary)' }}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={16} />
              <span className="hidden md:inline xl:hidden 2xl:inline">Log out</span>
            </button>
          </div>
        </div>

        {/* Row 2 (below xl): scrollable links with visible labels */}
        <nav
          aria-label="Main"
          className="nb-scroll -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 xl:hidden"
          style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}
        >
          {links.map((link) => {
            const active = isLinkActive(link.to);
            return (
              <Link
                key={link.label}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                className="nb-link nb-focus my-1 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold"
                style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}