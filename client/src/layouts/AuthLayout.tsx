import { Outlet, Link } from 'react-router-dom';
import { Layers, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../theme/ThemeToggle';

export default function AuthLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden veyra-paper flex flex-col">
      <div className="absolute inset-x-0 top-0 h-20 border-b border-[var(--veyra-line)] bg-[var(--veyra-surface)]/60 pointer-events-none" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center py-10 sm:py-14 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <Link to="/login" className="inline-flex items-center gap-3">
              <span className="h-10 w-10 rounded-lg border border-[var(--veyra-line-strong)] bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)] flex items-center justify-center shadow-sm">
                <Layers className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold tracking-tight text-[var(--veyra-ink)]">Veyra</span>
            </Link>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-[var(--veyra-surface)] border border-[var(--veyra-line)] rounded-full px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Secure multi-tenant workspace
            </div>
          </div>

          <div className="bg-[var(--veyra-surface)] rounded-2xl p-6 sm:p-8 shadow-sm border border-[var(--veyra-line)]">
            <Outlet />
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-400">
            Veyra keeps workspace access protected by tenant-scoped authentication.
          </p>
        </div>
      </main>
    </div>
  );
}
