import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { API_BASE_URL } from '../api/httpClient';
import { FaArrowLeft, FaGithub, FaGoogle, FaLock } from 'react-icons/fa';
import heroImage from '../assets/hero.png';

export default function LocalLoginPage() {
  const location = useLocation();
  const prefilledEmail = location.state?.email || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const token = res?.data?.token;
      if (token) {
        window.location.href = `/auth/callback?token=${encodeURIComponent(token)}`;
      } else {
        setError('Invalid server response');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL.replace(/\/$/, '')}/oauth2/authorization/github`;
  };

  // ✅ Add Google login handler
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL.replace(/\/$/, '')}/oauth2/authorization/google`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="auth-photo-bg absolute inset-0" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="auth-orb-a absolute -top-14 -left-16 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(249,115,22,0.18)' }} />
        <div className="auth-orb-b absolute bottom-0 right-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(253,186,116,0.24)' }} />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border shadow-sm backdrop-blur-md lg:grid-cols-[1.05fr_1fr]" style={{ borderColor: 'rgba(229,231,235,0.9)', background: 'rgba(255,255,255,0.7)' }}>
        <aside className="auth-enter-left hidden border-r p-10 lg:block" style={{ borderColor: 'rgba(229,231,235,0.85)', background: 'linear-gradient(165deg, rgba(249,115,22,0.16), rgba(253,186,116,0.26))' }}>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'rgba(249,115,22,0.28)', color: 'var(--primary)', background: 'rgba(255,255,255,0.65)' }}>
            <FaLock size={10} /> Secure Entry
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
            Sign in to
            <span className="block" style={{ color: 'var(--primary)' }}>Campus Control Center</span>
          </h1>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Access your bookings, incidents, and notifications from one role-aware workspace tuned for operational clarity.
          </p>

          <div className="mt-8 space-y-4">
            {[
              'Centralized booking lifecycle visibility',
              'Technician and admin escalation workflows',
              'Real-time alerts with threaded collaboration',
            ].map((item) => (
              <div key={item} className="rounded-xl border p-4" style={{ borderColor: 'rgba(229,231,235,0.9)', background: 'rgba(255,255,255,0.72)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="auth-enter-right p-6 sm:p-8 lg:p-10" style={{ background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(5px)' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-section)' }}
          >
            <FaArrowLeft size={10} /> Back to Home
          </button>

          <h2 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Local Login</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Use your email credentials to access SmartCampus.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2"
                style={{ borderColor: 'rgba(229,231,235,0.95)', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.75)' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2"
                style={{ borderColor: 'rgba(229,231,235,0.95)', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.75)' }}
              />
            </div>

            {error && <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#dc2626', background: 'rgba(254,242,242,0.9)' }}>{error}</div>}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="rounded-xl border px-5 py-3 text-sm font-semibold"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-section)' }}
              >
                Create Account
              </button>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>or continue with</p>
            <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="rounded-xl border px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'rgba(229,231,235,0.95)', background: 'rgba(255,255,255,0.78)', color: 'var(--text-primary)' }}
            >
              <span className="inline-flex items-center gap-2"><FaGoogle /> Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleGitHubLogin}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
            >
              <span className="inline-flex items-center gap-2"><FaGithub /> Continue with GitHub</span>
            </button>
          </div>
        </section>
      </div>

      <style>{`
        .auth-enter-left {
          opacity: 0;
          transform: translateX(-20px);
          animation: authInLeft 0.6s ease-out forwards;
        }

        .auth-enter-right {
          opacity: 0;
          transform: translateX(20px);
          animation: authInRight 0.62s ease-out 0.08s forwards;
        }

        .auth-orb-a {
          animation: orbA 12s ease-in-out infinite;
        }

        .auth-orb-b {
          animation: orbB 14s ease-in-out infinite;
        }

        .auth-photo-bg {
          opacity: 0.16;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          animation: photoFloat 16s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes authInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes authInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes orbA {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(16px, 22px); }
        }

        @keyframes orbB {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -16px); }
        }

        @keyframes photoFloat {
          0%, 100% { transform: scale(1.03); }
          50% { transform: scale(1.07); }
        }
      `}</style>
    </div>
  );
}