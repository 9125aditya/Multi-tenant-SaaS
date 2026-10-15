import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  Users,
  FileText,
  UserCircle,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { canManageUsers, canViewAuditLogs } from '../utils/permissions';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const showAdminNav = canManageUsers(user) || canViewAuditLogs(user);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setProfileMenuOpen(false);
    await logout();
    setIsLoggingOut(false);
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-600 font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-2 text-indigo-600">
            <Layers className="h-6 w-6" />
            <span className="font-bold text-slate-900 text-lg">SaaS Portal</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-6">
          <div>
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workspace
            </p>
            <div className="space-y-1">
              <NavLink
                to="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className={linkClass}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={linkClass}
              >
                <User className="h-4 w-4" />
                Profile
              </NavLink>
            </div>
          </div>

          {showAdminNav && (
            <div>
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Administration
              </p>
              <div className="space-y-1">
                {canManageUsers(user) && (
                  <NavLink
                    to="/users"
                    onClick={() => setSidebarOpen(false)}
                    className={linkClass}
                  >
                    <Users className="h-4 w-4" />
                    Users
                  </NavLink>
                )}
                {canViewAuditLogs(user) && (
                  <NavLink
                    to="/audit-logs"
                    onClick={() => setSidebarOpen(false)}
                    className={linkClass}
                  >
                    <FileText className="h-4 w-4" />
                    Audit Logs
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 flex items-center gap-2 sm:pl-2">
            {user?.tenantId && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Tenant: <span className="font-mono text-slate-700">{user.tenantId}</span>
              </span>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <UserCircle className="h-6 w-6 text-indigo-600" />
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-slate-900">
                  {user?.name || user?.email || 'Authenticated User'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{user?.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  )}
                  <p className="mt-1 inline-block text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                    {user?.role}
                  </p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Your Profile
                </Link>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}