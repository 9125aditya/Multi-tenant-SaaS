import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import ThemeToggle from '../theme/ThemeToggle';

function VeyraMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 64"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M10 8h14l16 24 16-24h14L48 56H32L10 8Z" />
      <path d="M10 8h14l16 24-8 8L10 8Z" opacity="0.62" />
      <path d="M24 8 40 32l-8 8L18 18 10 8h14Z" opacity="0.82" />
    </svg>
  );
}

export default function AuthLayout() {
  return (
    <div className="veyra-paper relative flex min-h-screen flex-col overflow-hidden">
      {/* Top rule */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 border-b border-[var(--veyra-line)] bg-[var(--veyra-surface)]/70" />

      {/* Theme */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-7 text-center">
            <Link
              to="/login"
              className="group inline-flex items-center gap-3"
              aria-label="Veyra home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--veyra-line-strong)] bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)] shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                <VeyraMark className="h-6 w-6" />
              </span>

              <span className="text-xl font-bold tracking-tight text-[var(--veyra-ink)]">
                Veyra
              </span>
            </Link>

            <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--veyra-line)] bg-[var(--veyra-surface)] px-3 py-1 text-[11px] font-semibold text-[var(--veyra-muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--veyra-accent)]" />
              Secure multi-tenant workspace
            </div>
          </div>

          {/* Auth surface */}
          <div className="veyra-card rounded-2xl p-6 sm:p-8">
            <Outlet />
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[11px] leading-5 text-[var(--veyra-muted)]">
            Veyra keeps workspace access protected by tenant-scoped
            authentication.
          </p>
        </div>
      </main>
    </div>
  );
}