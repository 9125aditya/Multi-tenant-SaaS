import { useEffect, useState } from 'react';
import {
  Building2,
  Shield,
  UserCheck,
  Fingerprint,
  Activity,
  AlertCircle,
  Loader2,
  FileText,
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

  useEffect(() => {
    if (!showAudits) return;

    let isMounted = true;
    (async () => {
      setIsLoadingAudits(true);
      setAuditError(null);
      try {
        const res = await auditApi.list({ limit: 5 });
        if (isMounted) {
          setAuditLogs(res.data || []);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        if (isMounted) {
          setAuditError(apiErr.message || 'Failed to load recent activity.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingAudits(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [showAudits]);

  const summaryCards = [
    {
      label: 'Tenant ID',
      value: user?.tenantId || '—',
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-600',
      isMono: true,
    },
    {
      label: 'Role',
      value: user?.role || 'USER',
      icon: Shield,
      color: 'bg-purple-50 text-purple-600',
      isMono: true,
    },
    {
      label: 'Account Status',
      value: 'Active & Verified',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600',
      isMono: false,
    },
    {
      label: 'User ID',
      value: user?.id ? `${user.id.slice(0, 10)}...` : '—',
      icon: Fingerprint,
      color: 'bg-amber-50 text-amber-600',
      isMono: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            Workspace Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || user?.email || 'User'}!
          </h1>
          <p className="text-sm text-slate-600">
            You are logged into tenant <span className="font-mono font-medium text-slate-900">{user?.tenantId}</span> with <span className="font-semibold text-indigo-600">{user?.role}</span> permissions.
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.label}
              </p>
              <p
                className={`text-lg font-bold text-slate-900 truncate max-w-[180px] ${
                  card.isMono ? 'font-mono text-sm' : ''
                }`}
                title={String(card.value)}
              >
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section (Admin & Super Admin Only) */}
      {showAudits && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
            </div>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
              Audit Logs API
            </span>
          </div>

          <div className="p-6">
            {isLoadingAudits ? (
              <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                <span>Loading recent activity...</span>
              </div>
            ) : auditError ? (
              <div className="flex items-start gap-2.5 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <span>{auditError}</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl space-y-2">
                <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-700">No recent activity found</p>
                <p className="text-xs text-slate-500">Actions in your tenant will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Action</th>
                      <th className="pb-3 px-4">Entity</th>
                      <th className="pb-3 px-4">User ID</th>
                      <th className="pb-3 pl-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-50 text-indigo-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {log.entity}
                          {log.entityId && (
                            <span className="block text-xs font-mono text-slate-400 truncate max-w-[150px]">
                              {log.entityId}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {log.userId}
                        </td>
                        <td className="py-3.5 pl-4 text-xs text-slate-500 text-right">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}