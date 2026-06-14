import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/httpClient';
import {
  FaArrowRight,
  FaBell,
  FaCalendarCheck,
  FaCheckCircle,
  FaEnvelope,
  FaGlobe,
  FaLayerGroup,
  FaLock,
  FaPhoneAlt,
  FaShieldAlt,
  FaTicketAlt,
  FaUsers,
} from 'react-icons/fa';

const HIGHLIGHTS = [
  {
    icon: <FaCalendarCheck size={16} />,
    title: 'Resource Scheduling',
    text: 'Reserve lecture halls, labs, and shared spaces with conflict-free allocation.',
  },
  {
    icon: <FaTicketAlt size={16} />,
    title: 'Incident Control',
    text: 'Track campus maintenance issues from submission through technician resolution.',
  },
  {
    icon: <FaBell size={16} />,
    title: 'Event Notifications',
    text: 'Receive approval updates, comments, and status changes in real time.',
  },
  {
    icon: <FaShieldAlt size={16} />,
    title: 'Role Governance',
    text: 'Purpose-built workflows for students, technicians, and administrators.',
  },
];

const METRICS = [
  { label: 'Monthly Reservations', value: '12.4K' },
  { label: 'Ticket Resolution', value: '96%' },
  { label: 'Live Users', value: '500+' },
  { label: 'System Uptime', value: '99.9%' },
];

const TIMELINE = [
  {
    phase: 'Phase 01',
    title: 'Secure Sign-In',
    detail: 'Authenticate via OAuth or local credentials with token-based access.',
  },
  {
    phase: 'Phase 02',
    title: 'Unified Operations',
    detail: 'Manage bookings, tickets, resources, and notifications in one workspace.',
  },
  {
    phase: 'Phase 03',
    title: 'Continuous Tracking',
    detail: 'Monitor request lifecycles with auditable updates and role visibility.',
  },
];

const REVIEWS = [
  {
    name: 'A. Perera',
    role: 'Operations Coordinator',
    quote: 'The workflow is clear and reliable. We cut manual follow-up time drastically in one semester.',
  },
  {
    name: 'R. Silva',
    role: 'Lab Technician',
    quote: 'Ticket updates and assignment visibility made our maintenance turnaround much faster.',
  },
  {
    name: 'S. Fernando',
    role: 'Department Admin',
    quote: 'Resource scheduling conflicts dropped, and approvals are far easier to monitor now.',
  },
];

const NAV_TABS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Reviews', href: '#reviews' },
];

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const isAdmin = Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN');
    const isTechnician = Array.isArray(user?.roles) && user.roles.includes('ROLE_TECHNICIAN');

    if (isAdmin) {
      navigate('/admin-dashboard');
    } else if (isTechnician) {
      navigate('/technician');
    } else {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleOAuthLogin = (provider) => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="mega-orb-a absolute -top-36 -left-36 h-[34rem] w-[34rem] rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(249,115,22,0.46), rgba(249,115,22,0.08) 55%, transparent 75%)' }} />
        <div className="mega-orb-b absolute top-[18%] right-[-10rem] h-[32rem] w-[32rem] rounded-full" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(253,186,116,0.42), rgba(253,186,116,0.08) 58%, transparent 78%)' }} />
        <div className="mega-orb-c absolute bottom-[-14rem] left-[18%] h-[30rem] w-[30rem] rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(249,115,22,0.28), rgba(249,115,22,0.06) 62%, transparent 80%)' }} />
        <div className="radar-wrap absolute left-1/2 top-[20%] -translate-x-1/2">
          <span className="radar-ring" />
          <span className="radar-ring radar-ring-delay" />
        </div>
        <div className="light-sweep absolute -top-12 left-[-22%] h-[140%] w-[38%] rotate-12" />
        <div className="absolute inset-0 opacity-[0.45]" style={{ backgroundImage: 'linear-gradient(to right, rgba(229,231,235,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(229,231,235,0.35) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <header className="nav-sticky sticky top-0 z-30 border-b backdrop-blur-sm" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.9)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-black" style={{ background: 'linear-gradient(140deg, var(--primary), var(--primary-hover))' }}>
              S
            </div>
            <div>
              <p className="text-sm font-black tracking-wide" style={{ color: 'var(--text-primary)' }}>SmartCampus</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Operational Intelligence for Campuses</p>
            </div>
            <span className="brand-ping inline-block h-2 w-2 rounded-full" style={{ background: 'var(--primary)' }} />
          </div>

          <nav className="hidden items-center gap-2 rounded-xl border p-1.5 lg:flex" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.82)' }}>
            {NAV_TABS.map((tab) => (
              <a
                key={tab.label}
                href={tab.href}
                className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {tab.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login/local')}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-secondary)' }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
            >
              Register
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-14 pt-10">
        <section className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="stage-enter rounded-3xl border p-8 shadow-sm" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.9)' }}>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'rgba(249,115,22,0.28)', color: 'var(--primary)', background: 'rgba(249,115,22,0.08)' }}>
              <FaLock size={10} /> Enterprise Authentication Layer
            </div>

            <h1 className="hero-shine mt-5 max-w-3xl text-4xl font-black leading-tight md:text-5xl" style={{ color: 'var(--text-primary)' }}>
              Modern Campus Management
              <span className="block" style={{ color: 'var(--primary)' }}>
                Built for Daily Operational Flow
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: 'var(--text-secondary)' }}>
              Consolidate booking orchestration, ticket governance, and role-aware collaboration in a mature interface designed for high-volume campus activity.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => handleOAuthLogin('github')}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
              >
                Continue with GitHub <FaArrowRight size={12} />
              </button>
              <button
                onClick={() => handleOAuthLogin('google')}
                className="rounded-xl border px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
              >
                Continue with Google
              </button>
              <button
                onClick={() => navigate('/login/local')}
                className="rounded-xl border px-5 py-3 text-sm font-semibold"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-section)', color: 'var(--text-secondary)' }}
              >
                Use Email Login
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {HIGHLIGHTS.map((item, index) => (
                <article
                  key={item.title}
                  className="lift-card rounded-2xl border p-4"
                  style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)', animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: 'linear-gradient(140deg, var(--primary), var(--primary-hover))' }}>
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="stage-enter-delayed space-y-4 rounded-3xl border p-6 shadow-sm" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Operations Overview
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
                <FaLayerGroup size={10} /> Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((metric) => (
                <div key={metric.label} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                  <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>{metric.value}</p>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(249,115,22,0.24)', background: 'rgba(249,115,22,0.08)' }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Workflow Timeline</p>
              <div className="mt-3 space-y-3">
                {TIMELINE.map((step, index) => (
                  <div key={step.phase} className="flex gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--primary)' }} />
                      {index < TIMELINE.length - 1 && <span className="mt-1 h-8 w-px" style={{ background: 'rgba(249,115,22,0.4)' }} />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>{step.phase}</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{step.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/signup')}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
            >
              Start Onboarding
            </button>
          </aside>
        </section>

        <div className="stage-enter-late mt-6 flex justify-center">
          <a href="#features" className="scroll-cue inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.85)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
            Scroll to Explore
          </a>
        </div>

        <section id="features" className="stage-enter-late mt-10 rounded-3xl border p-6 md:p-8" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ borderColor: 'rgba(249,115,22,0.28)', color: 'var(--primary)', background: 'rgba(249,115,22,0.08)' }}>
            <FaLayerGroup size={10} /> Features
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>
                Ready to run a smarter campus command center?
              </h2>
              <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                Deploy a modern operating experience for reservations, incidents, and notifications in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/login/local')}
                className="rounded-xl border px-5 py-3 text-sm font-semibold"
                style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
              >
                Local Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
              >
                Create Account
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="inline-flex items-center gap-2"><FaCheckCircle style={{ color: 'var(--primary)' }} /> OAuth + JWT security baseline</span>
            <span className="inline-flex items-center gap-2"><FaCheckCircle style={{ color: 'var(--primary)' }} /> Role-aware user experience</span>
          </div>
        </section>

        <section id="how-it-works" className="stage-enter-late mt-8 rounded-3xl border p-6 md:p-8" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ borderColor: 'rgba(249,115,22,0.28)', color: 'var(--primary)', background: 'rgba(249,115,22,0.08)' }}>
            <FaArrowRight size={10} /> How It Works
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TIMELINE.map((step) => (
              <article key={step.phase} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>{step.phase}</p>
                <h3 className="mt-2 text-lg font-black" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="stage-enter-late mt-8 rounded-3xl border p-6 md:p-8" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ borderColor: 'rgba(249,115,22,0.28)', color: 'var(--primary)', background: 'rgba(249,115,22,0.08)' }}>
            <FaGlobe size={10} /> About
          </div>
          <div className="grid gap-5 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <h2 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Purpose-built for campus scale operations</h2>
              <p className="mt-3 text-sm leading-relaxed md:text-base" style={{ color: 'var(--text-secondary)' }}>
                SmartCampus combines reservation orchestration, maintenance lifecycle management, and secure role controls into a single operating layer. The platform is designed for high-traffic academic environments where traceability, speed, and clarity matter.
              </p>
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(249,115,22,0.24)', background: 'rgba(249,115,22,0.08)' }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Trust Indicators</p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li className="inline-flex items-center gap-2"><FaCheckCircle style={{ color: 'var(--primary)' }} /> Token-based access control</li>
                <li className="inline-flex items-center gap-2"><FaCheckCircle style={{ color: 'var(--primary)' }} /> Role-aware data visibility</li>
                <li className="inline-flex items-center gap-2"><FaCheckCircle style={{ color: 'var(--primary)' }} /> Auditable action trails</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="reviews" className="stage-enter-late mt-8 rounded-3xl border p-6 md:p-8" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ borderColor: 'rgba(249,115,22,0.28)', color: 'var(--primary)', background: 'rgba(249,115,22,0.08)' }}>
            <FaUsers size={10} /> Reviews
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {REVIEWS.map((review) => (
              <article key={review.name} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  "{review.quote}"
                </p>
                <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{review.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{review.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-8 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-black" style={{ background: 'linear-gradient(140deg, var(--primary), var(--primary-hover))' }}>
                S
              </div>
              <div>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>SmartCampus</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Operational Intelligence for Campuses</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A modern platform for managing campus resources, maintenance operations, and communication workflows from one place.
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {NAV_TABS.map((tab) => (
                <li key={tab.label}>
                  <a href={tab.href} className="transition-colors hover:opacity-80">{tab.label}</a>
                </li>
              ))}
              <li><button onClick={() => navigate('/login/local')} className="text-left transition-colors hover:opacity-80">Login</button></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Contact</p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="inline-flex items-center gap-2"><FaEnvelope size={12} style={{ color: 'var(--primary)' }} /> support@smartcampus.edu</li>
              <li className="inline-flex items-center gap-2"><FaPhoneAlt size={12} style={{ color: 'var(--primary)' }} /> +94 11 123 4567</li>
            </ul>
          </div>
        </div>
        <div className="border-t px-6 py-4 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          SmartCampus © 2026. All rights reserved.
        </div>
      </footer>

      <style>{`
        .stage-enter {
          opacity: 0;
          transform: translateY(18px);
          animation: stageIn 0.65s ease-out forwards;
        }

        .stage-enter-delayed {
          opacity: 0;
          transform: translateY(18px);
          animation: stageIn 0.7s ease-out 0.14s forwards;
        }

        .stage-enter-late {
          opacity: 0;
          transform: translateY(18px);
          animation: stageIn 0.75s ease-out 0.24s forwards;
        }

        .lift-card {
          opacity: 0;
          transform: translateY(12px);
          animation: tileIn 0.5s ease-out forwards;
        }

        .mega-orb-a,
        .mega-orb-b,
        .mega-orb-c {
          filter: blur(2px);
          will-change: transform, opacity;
        }

        .mega-orb-a {
          animation: megaDriftA 14s ease-in-out infinite;
        }

        .mega-orb-b {
          animation: megaDriftB 16s ease-in-out infinite;
        }

        .mega-orb-c {
          animation: megaDriftC 18s ease-in-out infinite;
        }

        .radar-wrap {
          width: 22rem;
          height: 22rem;
          opacity: 0.42;
        }

        .radar-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid rgba(249, 115, 22, 0.3);
          animation: radarPulse 3.2s ease-out infinite;
        }

        .radar-ring-delay {
          animation-delay: 1.25s;
        }

        .light-sweep {
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.48) 48%,
            rgba(255, 255, 255, 0) 100%
          );
          mix-blend-mode: soft-light;
          animation: sweepMove 4.8s ease-in-out infinite;
        }

        .nav-sticky {
          box-shadow: 0 10px 24px rgba(17, 24, 39, 0.06);
        }

        .hero-shine {
          position: relative;
        }

        .hero-shine::after {
          content: '';
          position: absolute;
          left: -8%;
          top: -20%;
          width: 48%;
          height: 150%;
          background: linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0) 100%);
          transform: translateX(-180%) skewX(-16deg);
          animation: titleSweep 5.5s ease-in-out infinite;
          pointer-events: none;
        }

        .brand-ping {
          animation: brandPing 1.8s ease-in-out infinite;
        }

        .scroll-cue {
          animation: cueFloat 1.9s ease-in-out infinite;
        }

        @keyframes stageIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tileIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes megaDriftA {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.86; }
          50% { transform: translate(34px, 26px) scale(1.08) rotate(8deg); opacity: 1; }
        }

        @keyframes megaDriftB {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.82; }
          50% { transform: translate(-42px, -30px) scale(1.12) rotate(-10deg); opacity: 1; }
        }

        @keyframes megaDriftC {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.78; }
          50% { transform: translate(26px, -34px) scale(1.1) rotate(9deg); opacity: 0.95; }
        }

        @keyframes radarPulse {
          0% { transform: scale(0.35); opacity: 0.8; }
          70% { opacity: 0.25; }
          100% { transform: scale(1); opacity: 0; }
        }

        @keyframes sweepMove {
          0%, 100% { transform: translateX(-140%) rotate(12deg); opacity: 0.22; }
          50% { transform: translateX(280%) rotate(12deg); opacity: 0.55; }
        }

        @keyframes titleSweep {
          0%, 70%, 100% { transform: translateX(-180%) skewX(-16deg); opacity: 0; }
          78% { opacity: 1; }
          90% { transform: translateX(260%) skewX(-16deg); opacity: 0.95; }
        }

        @keyframes brandPing {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.35); opacity: 1; }
        }

        @keyframes cueFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .stage-enter,
          .stage-enter-delayed,
          .stage-enter-late,
          .lift-card,
          .mega-orb-a,
          .mega-orb-b,
          .mega-orb-c,
          .radar-ring,
          .light-sweep,
          .brand-ping,
          .scroll-cue,
          .hero-shine::after {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
