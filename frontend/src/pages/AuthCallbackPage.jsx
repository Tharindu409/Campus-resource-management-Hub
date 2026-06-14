import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithToken, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    // start login flow
    loginWithToken(token);
    // wait for auth context to finish loading and then redirect appropriately
  }, [token, loginWithToken, navigate]);

  useEffect(() => {
    if (token == null) return;
    if (!loading) {
      if (isAuthenticated) {
        const isAdmin = Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN');
        const isTechnician = Array.isArray(user?.roles) && user.roles.includes('ROLE_TECHNICIAN');
        if (isAdmin) {
          navigate('/admin-dashboard', { replace: true });
        } else if (isTechnician) {
          navigate('/technician', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4
                        border-[var(--primary)] mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)] text-lg">Signing you in...</p>
      </div>
    </div>
  );
}