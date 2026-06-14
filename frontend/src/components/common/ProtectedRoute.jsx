import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole, requiredRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasRequiredRole = requiredRole ? user?.roles?.includes(requiredRole) : true;
  const hasAnyRequiredRole = Array.isArray(requiredRoles) && requiredRoles.length > 0
    ? requiredRoles.some((role) => user?.roles?.includes(role))
    : true;

  if (!hasRequiredRole || !hasAnyRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Access Denied</h2>
          <p className="text-[var(--text-secondary)] mt-2">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}