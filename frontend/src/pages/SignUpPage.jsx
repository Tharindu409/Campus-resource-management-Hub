import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { FaArrowLeft, FaCheckCircle, FaUserShield } from 'react-icons/fa';
import heroImage from '../assets/hero.png';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(form);
      const token = res?.data?.token;

      if (!token) {
        setError('Registration succeeded but token is missing. Please login.');
        navigate('/login/local', { replace: true, state: { email: form.email } });
        return;
      }

      window.location.href = `/auth/callback?token=${encodeURIComponent(token)}`;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="signup-photo-bg absolute inset-0" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="signup-orb-a absolute -top-14 right-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(249,115,22,0.2)' }} />
        <div className="signup-orb-b absolute bottom-0 -left-12 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(253,186,116,0.2)' }} />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border shadow-sm backdrop-blur-md lg:grid-cols-[1fr_1.1fr]" style={{ borderColor: 'rgba(229,231,235,0.9)', background: 'rgba(255,255,255,0.7)' }}>
        <aside className="signup-enter-left hidden border-r p-10 lg:block" style={{ borderColor: 'rgba(229,231,235,0.9)', background: 'rgba(249,250,251,0.66)' }}>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ borderColor: 'rgba(249,115,22,0.3)', color: 'var(--primary)', background: 'rgba(249,115,22,0.08)' }}>
            <FaUserShield size={10} /> New User Onboarding
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
            Create Your
            <span className="block" style={{ color: 'var(--primary)' }}>SmartCampus Account</span>
          </h1>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Start managing campus reservations and maintenance workflows with a secured, role-ready identity.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Fast onboarding with JWT authentication',
              'Immediate access to booking and ticket modules',
              'Consistent role controls across all pages',
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: 'rgba(229,231,235,0.9)', background: 'rgba(255,255,255,0.72)' }}>
                <FaCheckCircle className="mt-0.5" style={{ color: 'var(--primary)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{line}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="signup-enter-right p-6 sm:p-8 lg:p-10" style={{ background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(5px)' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-section)', color: 'var(--text-secondary)' }}
          >
            <FaArrowLeft size={10} /> Back to Home
          </button>

          <h2 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Register Account</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Complete the form to create your SmartCampus profile.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <input
                required
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: 'rgba(229,231,235,0.95)', background: 'rgba(255,255,255,0.75)', color: 'var(--text-primary)' }}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                required
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: 'rgba(229,231,235,0.95)', background: 'rgba(255,255,255,0.75)', color: 'var(--text-primary)' }}
                placeholder="yourname@example.com"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <input
                  required
                  name="password"
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={onChange}
                  className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: 'rgba(229,231,235,0.95)', background: 'rgba(255,255,255,0.75)', color: 'var(--text-primary)' }}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: 'rgba(229,231,235,0.95)', background: 'rgba(255,255,255,0.75)', color: 'var(--text-primary)' }}
                  placeholder="Repeat password"
                />
              </div>
            </div>

            {error && <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#dc2626', background: 'rgba(254,242,242,0.9)' }}>{error}</div>}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login/local')}
                className="rounded-xl border px-5 py-3 text-sm font-semibold"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-section)' }}
              >
                Already have an account?
              </button>
            </div>
          </form>
        </section>
      </div>

      <style>{`
        .signup-enter-left {
          opacity: 0;
          transform: translateX(-18px);
          animation: signupInLeft 0.58s ease-out forwards;
        }

        .signup-enter-right {
          opacity: 0;
          transform: translateX(18px);
          animation: signupInRight 0.62s ease-out 0.08s forwards;
        }

        .signup-orb-a {
          animation: signupOrbA 12s ease-in-out infinite;
        }

        .signup-orb-b {
          animation: signupOrbB 14s ease-in-out infinite;
        }

        .signup-photo-bg {
          opacity: 0.16;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          animation: signupPhotoFloat 16s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes signupInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes signupInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes signupOrbA {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-16px, 20px); }
        }

        @keyframes signupOrbB {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -16px); }
        }

        @keyframes signupPhotoFloat {
          0%, 100% { transform: scale(1.03); }
          50% { transform: scale(1.07); }
        }
      `}</style>
    </div>
  );
}