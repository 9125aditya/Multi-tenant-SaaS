import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { Role } from '../types';

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
        <Loader2 className="h-5 w-5 animate-spin text-stone-600" />
        <span>Restoring session...</span>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-lg mx-auto my-8 text-center space-y-4 shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">403 — Access Forbidden</h2>
          <p className="text-sm text-slate-600">
            Your current role (<span className="font-mono font-semibold">{user?.role}</span>) does not have permission to view this administrative page.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-stone-600 text-white hover:bg-stone-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}