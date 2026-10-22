import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  User as UserIcon,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { auditApi } from '../../services/api/audit';
import { usersApi } from '../../services/api/users';
import { ActionBadge } from '../../components/audit/ActionBadge';
import { AuditLogDetailsModal } from '../../components/audit/AuditLogDetailsModal';
import type { AuditLog, User, ApiError } from '../../types';

export default function AuditLogsPage() {
  const { success, error: showError } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [actionInput, setActionInput] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('ALL');

  // Tenant Users cache for resolving userId -> name/email
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch users once on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await usersApi.getUsers();

        if (isMounted) {
          setTenantUsers(res.data || []);
        }
      } catch (err) {
        console.error(
          'Failed to preload tenant users for audit logs:',
          err,
        );

        if (isMounted) {
          showError({
            title: 'Unable to load users',
            message:
              'User names may not be available in the audit log details.',
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [showError]);

  // Fetch audit logs when page, limit, selectedAction, or selectedUserId changes
  const fetchAuditLogs = useCallback(
    async (showRefreshToast = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await auditApi.getAuditLogs({
          action: selectedAction || undefined,
          userId:
            selectedUserId !== 'ALL'
              ? selectedUserId
              : undefined,
          page,
          limit,
        });

        setLogs(res.data || []);
        setTotal(res.total || 0);

        if (showRefreshToast) {
          success({
            title: 'Audit logs refreshed',
            message: 'The latest activity is now displayed.',
          });
        }
      } catch (err) {
        const apiErr = err as ApiError;

        let message =
          apiErr.message ||
          'Failed to load audit logs. Please try again.';

        if (apiErr.status === 403) {
          message = 'You do not have permission to view audit logs.';
        }

        setError(message);

        showError({
          title: 'Unable to load audit logs',
          message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedAction,
      selectedUserId,
      page,
      limit,
      success,
      showError,
    ],
  );

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const totalPages = Math.ceil(total / limit) || 1;

  // User display helper
  const getUserDisplay = useCallback(
    (userId: string | null) => {
      if (!userId) return 'System / Unknown';

      const found = tenantUsers.find((u) => u.id === userId);

      if (found) {
        return `${found.name || found.email} (${found.role})`;
      }

      return `${userId.slice(0, 10)}...`;
    },
    [tenantUsers],
  );

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSelectedAction(actionInput.trim());
  };

  const handleResetFilters = () => {
    setActionInput('');
    setSelectedAction('');
    setSelectedUserId('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Audit Logs
            </h1>

            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
              {total} entries
            </span>
          </div>

          <p className="mt-0.5 text-sm text-slate-500">
            Track security events, administrative changes, and tenant activity in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchAuditLogs(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={handleApplyFilters}
        className="grid grid-cols-1 items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Filter by Action
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="e.g. LOGIN, USER_CREATED"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Filter by User
          </label>

          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
            >
              <option value="ALL">All Users</option>

              {tenantUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-500"
          >
            <Filter className="h-4 w-4" />
            <span>Apply Filters</span>
          </button>

          {(selectedAction || selectedUserId !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick filters
        </span>

        {[
          'LOGIN',
          'LOGOUT',
          'USER_CREATED',
          'USER_UPDATED',
          'ROLE_CHANGED',
          'USER_DELETED',
        ].map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => {
              setActionInput(action);
              setSelectedAction(action);
              setPage(1);
            }}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
              selectedAction === action
                ? 'border-stone-200 bg-stone-50 text-stone-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-sm text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
            <span>Loading audit logs...</span>
          </div>
        ) : error ? (
          <div className="space-y-3 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>

            <p className="text-base font-semibold text-slate-800">
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchAuditLogs(true)}
              className="rounded-lg bg-stone-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-500"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="space-y-2 px-4 py-24 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />

            <p className="text-base font-semibold text-slate-800">
              {selectedAction || selectedUserId !== 'ALL'
                ? 'No audit logs match your filters.'
                : 'No audit activity found.'}
            </p>

            <p className="mx-auto max-w-sm text-xs text-slate-500">
              Actions performed across your tenant will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-700">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                      {getUserDisplay(log.userId)}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600">
                      {log.entity ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-800">
                          {log.entity}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {log.ipAddress || '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && logs.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Showing page{' '}
                <span className="font-semibold text-slate-700">
                  {page}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {totalPages}
                </span>{' '}
                ({total} total entries)
              </span>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-stone-600"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((p) => Math.max(p - 1, 1))
                }
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-medium text-slate-700">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(p + 1, totalPages))
                }
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuditLogDetailsModal
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        getUserDisplay={getUserDisplay}
      />
    </div>
  );
}