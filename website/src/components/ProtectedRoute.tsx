import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Route guard — redirects to login if unauthenticated.
 * If allowedRoles is specified, also enforces role-based access.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, initialized, loading } = useAuthStore();
  const location = useLocation();

  // While session is being validated, show a blank screen (prevents flash)
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-black text-xl shadow-lg animate-pulse">
            T
          </div>
          <p className="text-sm font-semibold text-gray-400 animate-pulse">Loading Tastifyy...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — send to login, preserve intended destination
  if (!user) {
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's correct dashboard
    const dashboardMap: Record<UserRole, string> = {
      customer: '/customer/home',
      restaurant_partner: '/restaurant/dashboard',
      delivery_partner: '/delivery/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role]} replace />;
  }

  return <>{children}</>;
}
