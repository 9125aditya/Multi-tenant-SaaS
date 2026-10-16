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
  Layers,
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import ThemeToggle from '../theme/ThemeToggle';

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

  const showAdminFeatures = ['ADMIN', 'SUPER_ADMIN'].includes(
    user?.role ?? '',
  );

  const workspaceNavigation = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Tenant Settings',
      href: '/settings/tenant',
      icon: Building2,
    },
  ];

  const adminNavigation = [
    {
      name: 'User Management',
      href: '/users',
      icon: Users,
    },
    {
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: FileText,
    },
  ];

  const initials = (user?.name || user?.email || 'VU')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderNavigation = (
    items: typeof workspaceNavigation,
  ) => (
    <div className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={() => setMobileMenuOpen(false)}
          className={({ isActive }) =>
            [
              'group flex items-center gap-3',
              'rounded-lg px-3 py-2.5',
              'text-sm font-medium',
              'transition-colors',
              isActive
                ? 'bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)] ring-1 ring-[var(--veyra-line-strong)]'
                : 'text-[var(--veyra-ink-soft)] hover:bg-[var(--veyra-paper-deep)] hover:text-[var(--veyra-ink)]',
            ].join(' ')
          }
        >
          {({ isActive }) => {
            const Icon = item.icon;

            return (
              <>
                <Icon
                  className={[
                    'h-4 w-4 shrink-0',
                    isActive
                      ? 'text-[var(--veyra-accent)]'
                      : 'text-[var(--veyra-ink-soft)]',
                  ].join(' ')}
                />

                <span>{item.name}</span>
              </>
            );
          }}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="veyra-paper min-h-screen flex flex-col antialiased md:flex-row">
      {/* =========================================================
          MOBILE TOP BAR
      ========================================================= */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--veyra-line)] bg-[var(--veyra-surface)] px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--veyra-line-strong)] bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)] shadow-sm">
            <Layers className="h-5 w-5" />
          </div>

          <div>
            <span className="block text-sm font-bold leading-none tracking-tight text-[var(--veyra-ink)]">
              Veyra
            </span>

            <span className="text-[10px] text-[var(--veyra-ink-soft)]">
              Workspace Platform
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          className="rounded-lg p-2 text-[var(--veyra-ink-soft)] transition-colors hover:bg-[var(--veyra-paper-deep)] hover:text-[var(--veyra-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--veyra-ring)]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* =========================================================
          MOBILE MENU BACKDROP
      ========================================================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/15 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40',
          'flex w-72 shrink-0 flex-col',
          'border-r border-[var(--veyra-line)]',
          'bg-[var(--veyra-surface)]',
          'shadow-lg transition-transform duration-300 ease-in-out',
          'md:static md:w-64 md:translate-x-0 md:shadow-none',
          mobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full',
        ].join(' ')}
      >
        {/* Desktop Brand */}
        <div className="hidden items-center gap-3 border-b border-[var(--veyra-line)] px-5 py-5 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--veyra-line-strong)] bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)] shadow-sm">
            <Layers className="h-5 w-5" />
          </div>

          <div>
            <span className="block font-bold leading-snug tracking-tight text-[var(--veyra-ink)]">
              Veyra
            </span>

            <span className="text-[11px] text-[var(--veyra-ink-soft)]">
              Workspace Platform
            </span>
          </div>
        </div>

        {/* =======================================================
            CURRENT USER
        ======================================================= */}
        <div className="mx-4 my-4 rounded-xl border border-[var(--veyra-line)] bg-[var(--veyra-paper)]/70 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--veyra-ink)] text-xs font-bold text-[var(--veyra-paper)]">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[var(--veyra-ink)]">
                {user?.name || user?.email || 'Workspace User'}
              </p>

              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[var(--veyra-ink-soft)]">
                <Shield className="h-3 w-3 text-[var(--veyra-accent)]" />

                <span className="uppercase tracking-wider">
                  {user?.role || 'USER'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================
            NAVIGATION
        ======================================================= */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {/* Overview */}
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--veyra-ink-soft)]">
            Overview
          </div>

          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3',
                'rounded-lg px-3 py-2.5',
                'text-sm font-medium',
                'transition-colors',
                isActive
                  ? 'bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)] ring-1 ring-[var(--veyra-line-strong)]'
                  : 'text-[var(--veyra-ink-soft)] hover:bg-[var(--veyra-paper-deep)] hover:text-[var(--veyra-ink)]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard
                  className={[
                    'h-4 w-4',
                    isActive
                      ? 'text-[var(--veyra-accent)]'
                      : 'text-[var(--veyra-ink-soft)]',
                  ].join(' ')}
                />

                <span>Dashboard</span>
              </>
            )}
          </NavLink>

          {/* Workspace */}
          <div className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--veyra-ink-soft)]">
            Workspace
          </div>

          {renderNavigation(workspaceNavigation)}

          {/* Administration */}
          {showAdminFeatures && (
            <>
              <div className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--veyra-ink-soft)]">
                Administration
              </div>

              {renderNavigation(adminNavigation)}
            </>
          )}
        </nav>

        {/* =======================================================
            LOGOUT
        ======================================================= */}
        <div className="border-t border-[var(--veyra-line)] p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--veyra-ink-soft)] transition-colors hover:bg-[var(--veyra-paper-deep)] hover:text-[var(--veyra-destructive)] focus:outline-none focus:ring-2 focus:ring-[var(--veyra-ring)]"
          >
            <LogOut className="h-4 w-4 shrink-0" />

            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10">
        {/* Top toolbar */}
        <div className="mb-6 flex items-center justify-end">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-[1500px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}