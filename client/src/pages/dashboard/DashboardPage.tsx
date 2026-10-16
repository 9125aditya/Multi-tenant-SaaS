import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Shield,
  UserCheck,
  Fingerprint,
  Activity,
  AlertCircle,
  Loader2,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { auditApi } from '../../services/api/audit';
import { canViewAuditLogs } from '../../utils/permissions';
import type { AuditLog, ApiError } from '../../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const showAudits = canViewAuditLogs(user);
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (!showAudits) return;

    let isMounted = true;
    (async () => {
      setIsLoadingAudits(true);
      setAuditError(null);
      try {
        const res = await auditApi.getAuditLogs({ limit: 5 });
        if (isMounted) setAuditLogs(res.data || []);
      } catch (err) {
        const apiErr = err as ApiError;
        if (isMounted) setAuditError(apiErr.message || 'Failed to load recent activity.');
      } finally {
        if (isMounted) setIsLoadingAudits(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [showAudits]);

  const summaryCards = [
    {
      label: 'Tenant',
      value: user?.tenantId || '—',
      detail: 'Current workspace',
      icon: Building2,
      isMono: true,
    },
    {
      label: 'Access Level',
      value: user?.role || 'USER',
      detail: 'Assigned workspace role',
      icon: Shield,
      isMono: false,
    },
    {
      label: 'Account',
      value: 'Active & Verified',
      detail: 'Email verification complete',
      icon: UserCheck,
      isMono: false,
    },
    {
      label: 'User ID',
      value: user?.id ? `${user.id.slice(0, 12)}...` : '—',
      detail: 'Authenticated account',
      icon: Fingerprint,
      isMono: true,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
            Workspace overview
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--veyra-ink)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A clear view of your workspace, access and recent activity.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 sm:text-right">
          {formattedDate}
        </div>
      </div>

      {/* Welcome Card */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--veyra-line)] bg-[var(--veyra-surface)] p-6 sm:p-8 shadow-sm">
        <div className="absolute left-0 top-0 h-full w-1 bg-[var(--veyra-accent)]" />
        <div className="relative max-w-3xl pl-2 sm:pl-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active session
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--veyra-ink)]">
            Welcome back, {user?.name || user?.email || 'User'}.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You are working inside your tenant with{' '}
            <span className="font-semibold text-[var(--veyra-ink)]">{user?.role}</span>{' '}
            permissions. Your workspace data remains scoped to this tenant.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Tenant</span>
            <span className="rounded-md border border-[var(--veyra-line)] bg-[var(--veyra-paper)] px-2.5 py-1 font-mono text-[var(--veyra-ink)]">
              {user?.tenantId || '—'}
            </span>
          </div>
        </div>
      </section>

      {/* Summary Metrics */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--veyra-ink)]">Workspace details</h2>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Current session</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="group rounded-xl border border-[var(--veyra-line)] bg-[var(--veyra-surface)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    {card.label}
                  </p>
                  <p
                    className={`mt-2 truncate font-bold text-[var(--veyra-ink)] ${
                      card.isMono ? 'font-mono text-xs' : 'text-base'
                    }`}
                    title={String(card.value)}
                  >
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
                </div>
                <div className="shrink-0 rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] p-2.5 text-[var(--veyra-accent)]">
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      {showAudits && (
        <section className="overflow-hidden rounded-xl border border-[var(--veyra-line)] bg-[var(--veyra-surface)] shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[var(--veyra-line)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] p-2 text-[var(--veyra-accent)]">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--veyra-ink)]">Recent activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  The latest security and operational events in your workspace.
                </p>
              </div>
            </div>
            <Link
              to="/audit-logs"
              className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] px-3 py-2 text-xs font-semibold text-[var(--veyra-ink)] transition-colors hover:bg-[var(--veyra-paper-deep)] sm:self-auto"
            >
              View all logs
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-5">
            {isLoadingAudits ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--veyra-accent)]" />
                <span>Loading recent activity...</span>
              </div>
            ) : auditError ? (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{auditError}</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="space-y-2 rounded-xl border border-dashed border-[var(--veyra-line-strong)] py-12 text-center">
                <FileText className="mx-auto h-7 w-7 text-slate-400" />
                <p className="text-sm font-semibold text-[var(--veyra-ink)]">No recent activity</p>
                <p className="text-xs text-slate-500">Actions performed in your tenant will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--veyra-line)] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      <th className="px-3 py-3">Action</th>
                      <th className="px-3 py-3">Entity</th>
                      <th className="px-3 py-3">User</th>
                      <th className="px-3 py-3 text-right">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--veyra-line)] text-sm">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-[var(--veyra-paper)]/70">
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--veyra-line)] bg-[var(--veyra-paper)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--veyra-ink)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--veyra-accent)]" />
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-medium text-[var(--veyra-ink)]">
                          {log.entity || '—'}
                          {log.entityId && (
                            <span className="block max-w-[180px] truncate font-mono text-[10px] text-slate-400">
                              {log.entityId}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 font-mono text-xs text-slate-500">
                          {log.userId ? `${log.userId.slice(0, 12)}...` : 'System'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 border-t border-[var(--veyra-line)] pt-5 text-xs text-slate-500">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>Session is active and tenant-scoped.</span>
      </div>
    </div>
  );
}
