import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Building2,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const showAdminFeatures = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role ?? '');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Tenant Settings', href: '/settings/tenant', icon: Building2 },
    ...(showAdminFeatures
      ? [
          { name: 'User Management', href: '/users', icon: Users },
          { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            S
          </div>
          <span className="font-bold text-slate-900">SaaS Workspace</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-600 hover:text-slate-900 p-1"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <aside
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-white border-r border-slate-200 shrink-0 fixed md:static inset-y-0 left-0 z-40 pt-16 md:pt-0`}
      >
        <div className="hidden md:flex items-center gap-2.5 px-6 py-5 border-b border-slate-100">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            S
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-none">SaaS App</span>
            <span className="text-[11px] text-slate-400 font-mono">Multi-Tenant v1.0</span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 mx-3 my-3 rounded-xl">
          <p className="text-xs font-semibold text-slate-900 truncate">
            {user?.name || user?.email || 'Workspace User'}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-600 font-medium">
            <Shield className="h-3 w-3" />
            <span>{user?.role}</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 py-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}