import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/httpClient';
import { reviewApi } from '../api/reviewApi';
import {
  FaArrowRight,
  FaBell,
  FaCalendarCheck,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaGlobe,
  FaLayerGroup,
  FaLock,
  FaPhoneAlt,
  FaShieldAlt,
  FaStar,
  FaTicketAlt,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

import logoMark from '../assets/logo/smart-campus-logo.jpg';
 

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

const EMPTY_REVIEW_FORM = {
  name: '',
  role: '',
  rating: 5,
  message: '',
};

const NAV_TABS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Reviews', href: '#reviews' },
];

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await reviewApi.getReviews();
      const reviewList = Array.isArray(response?.data) ? response.data : [];
      setReviews(reviewList);
      setActiveReviewIndex((current) => (reviewList.length === 0 ? 0 : Math.min(current, reviewList.length - 1)));
    } catch (error) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

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

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return undefined;

    const intervalId = setInterval(() => {
      setActiveReviewIndex((current) => (current + 1) % reviews.length);
    }, 4200);

    return () => clearInterval(intervalId);
  }, [reviews.length]);

  const handleOAuthLogin = (provider) => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  };

  const handleReviewFieldChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((current) => ({
      ...current,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewForm.name.trim() || !reviewForm.message.trim()) {
      alert('Please provide your name and review message.');
      return;
    }

    try {
      setIsSavingReview(true);

      if (editingReviewId) {
        const response = await reviewApi.updateReview(editingReviewId, reviewForm);
        const updatedReview = response?.data;
        setReviews((current) => current.map((review) => (review.id === updatedReview.id ? updatedReview : review)));
      } else {
        const response = await reviewApi.addReview(reviewForm);
        const newReview = response?.data;
        setReviews((current) => [newReview, ...current]);
      }

      setReviewForm(EMPTY_REVIEW_FORM);
      setEditingReviewId(null);
      await loadReviews();
    } catch (error) {
      alert(error?.response?.data?.message || 'Unable to save the review right now.');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setReviewForm({
      name: review.name || '',
      role: review.role || '',
      rating: review.rating || 5,
      message: review.message || '',
    });
    window.scrollTo({ top: document.getElementById('reviews')?.offsetTop || 0, behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;

    try {
      await reviewApi.deleteReview(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setActiveReviewIndex(0);
    } catch (error) {
      alert(error?.response?.data?.message || 'Unable to delete the review.');
    }
  };

  const activeReview = reviews[activeReviewIndex] || null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip" style={{ background: 'var(--bg-primary)' }}>
      <div className="pointer-events-none absolute inset-0 overflow-clip">
        <div className="landing-background-image absolute inset-0" />
        <div className="mega-orb-a absolute -top-36 -left-36 h-[34rem] w-[34rem] rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(124,58,237,0.42), rgba(168,85,247,0.08) 55%, transparent 75%)' }} />
        <div className="mega-orb-b absolute top-[18%] right-[-10rem] h-[32rem] w-[32rem] rounded-full" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(196,181,253,0.44), rgba(196,181,253,0.08) 58%, transparent 78%)' }} />
        <div className="mega-orb-c absolute bottom-[-14rem] left-[18%] h-[30rem] w-[30rem] rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.26), rgba(167,139,250,0.06) 62%, transparent 80%)' }} />
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

             <img
                  src={logoMark}
                  alt=""
                  className="h-11 w-auto shrink-0"
                  draggable={false}
              />

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

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-6 pb-14 pt-10">
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ borderColor: 'rgba(124,58,237,0.25)', color: 'var(--primary)', background: 'rgba(124,58,237,0.08)' }}>
            <FaUsers size={10} /> Reviews
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
              {loadingReviews ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading reviews…</p>
              ) : activeReview ? (
                <div className="review-slide-enter">
                  <div className="mb-3 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FaStar key={index} size={14} className={index < activeReview.rating ? 'opacity-100' : 'opacity-25'} />
                    ))}
                  </div>
                  <p className="text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    “{activeReview.message}”
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{activeReview.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{activeReview.role || 'Campus user'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleEditReview(activeReview)} className="rounded-lg border px-2 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        <FaEdit size={12} className="inline-block" />
                      </button>
                      <button type="button" onClick={() => handleDeleteReview(activeReview.id)} className="rounded-lg border px-2 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        <FaTrash size={12} className="inline-block" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No reviews yet. Be the first to share your experience.</p>
              )}

              {reviews.length > 1 && (
                <div className="mt-5 flex items-center gap-2">
                  {reviews.map((review, index) => (
                    <button
                      key={review.id || `${review.name}-${index}`}
                      type="button"
                      onClick={() => setActiveReviewIndex(index)}
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: index === activeReviewIndex ? '2rem' : '0.8rem',
                        background: index === activeReviewIndex ? 'var(--primary)' : 'rgba(124,58,237,0.25)',
                      }}
                      aria-label={`View review ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-section)' }}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                  {editingReviewId ? 'Update your review' : 'Share your experience'}
                </p>
                {editingReviewId && (
                  <button type="button" onClick={() => { setEditingReviewId(null); setReviewForm(EMPTY_REVIEW_FORM); }} className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <input
                  name="name"
                  value={reviewForm.name}
                  onChange={handleReviewFieldChange}
                  placeholder="Your name"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                />
                <input
                  name="role"
                  value={reviewForm.role}
                  onChange={handleReviewFieldChange}
                  placeholder="Role or department"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                />
                <select
                  name="rating"
                  value={reviewForm.rating}
                  onChange={handleReviewFieldChange}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
                <textarea
                  name="message"
                  value={reviewForm.message}
                  onChange={handleReviewFieldChange}
                  placeholder="Tell us how the app helped you..."
                  rows={5}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSavingReview}
                className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
              >
                {isSavingReview ? 'Saving…' : editingReviewId ? 'Update Review' : 'Submit Review'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t-2" style={{ borderColor: '#8b5cf6', background: 'linear-gradient(180deg, #2a1747 0%, #1d1033 100%)' }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 md:grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr]">
          <div>
            <img src={logoMark} alt="Smart Campus Resources Hub" className="h-14 w-auto" draggable={false} />
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
              One place to coordinate campus resources, maintenance, and communication.
            </p>
          </div>

          <nav aria-label="Footer" >
            <p className="text-xs font-black uppercase tracking-wider text-white">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              {NAV_TABS.map((tab) => (
                <li key={tab.label}>
                  <a href={tab.href} className="transition-colors hover:text-white">{tab.label}</a>
                </li>
              ))}
              <li><button onClick={() => navigate('/login/local')} className="text-left transition-colors hover:text-white">Login</button></li>
            </ul>
          </nav>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white">Contact</p>
            <ul className="mt-3 space-y-3 text-sm text-white/75">
              <li className="flex items-center gap-2"><FaEnvelope size={13} style={{ color: '#d8b4fe' }} /> support@smartcampus.edu</li>
              <li className="flex items-center gap-2"><FaPhoneAlt size={13} style={{ color: '#d8b4fe' }} /> +94 11 123 4567</li>
            </ul>
          </div>
        </div>
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(16, 9, 25, 0.75)' }}>
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between text-white/70">
            <span>Smart Campus Resources Hub © 2026</span>
            <span>Campus operations, connected.</span>
          </div>
        </div>
      </footer>

      <style>
        {`
        .landing-background-image {
          background-image:
            linear-gradient(120deg, rgba(247, 245, 255, 0.82), rgba(243, 240, 255, 0.32)),
            url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.9;
          filter: saturate(0.82) contrast(1.06);
        }

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

        .review-slide-enter {
          animation: reviewSlideIn 0.45s ease-out;
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

        @keyframes reviewSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
