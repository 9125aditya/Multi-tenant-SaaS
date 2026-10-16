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
import { auditApi } from '../../services/api/audit';
import { usersApi } from '../../services/api/users';
import { ActionBadge } from '../../components/audit/ActionBadge';
import { AuditLogDetailsModal } from '../../components/audit/AuditLogDetailsModal';
import type { AuditLog, User, ApiError } from '../../types';

export default function AuditLogsPage() {
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
        console.error('Failed to preload tenant users for audit logs:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch audit logs when page, limit, selectedAction, or selectedUserId changes
  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await auditApi.getAuditLogs({
        action: selectedAction || undefined,
        userId: selectedUserId !== 'ALL' ? selectedUserId : undefined,
        page,
        limit,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setError('You do not have permission to view audit logs.');
      } else {
        setError(apiErr.message || 'Failed to load audit logs. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedAction, selectedUserId, page, limit]);

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
    [tenantUsers]
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
              {total} entries
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Track security events, administrative changes, and tenant activity in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={handleApplyFilters}
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Filter by Action
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. LOGIN, USER_CREATED"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Filter by User
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
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
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-stone-600 hover:bg-stone-500 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Apply Filters</span>
          </button>
          {(selectedAction || selectedUserId !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
          Quick filters
        </span>
        {['LOGIN', 'LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'ROLE_CHANGED', 'USER_DELETED'].map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => {
              setActionInput(action);
              setSelectedAction(action);
              setPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
              selectedAction === action
                ? 'bg-stone-50 text-stone-700 border-stone-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
            <span>Loading audit logs...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-600 text-white hover:bg-stone-500 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-24 px-4 space-y-2">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">
              {selectedAction || selectedUserId !== 'ALL'
                ? 'No audit logs match your filters.'
                : 'No audit activity found.'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Actions performed across your tenant will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Target Entity</th>
                  <th className="py-3.5 px-6">IP Address</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-900">
                      {getUserDisplay(log.userId)}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {log.entity ? (
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {log.entity}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-slate-500">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors"
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
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Showing page <span className="font-semibold text-slate-700">{page}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span> ({total} total
                entries)
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
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-slate-700 px-2">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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