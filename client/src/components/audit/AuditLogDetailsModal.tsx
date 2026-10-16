import { X, FileText, Globe, Monitor, ShieldCheck, User } from 'lucide-react';
import type { AuditLog } from '../../types';
import { ActionBadge } from './ActionBadge';

interface AuditLogDetailsModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
  getUserDisplay: (userId: string | null) => string;
}

export function AuditLogDetailsModal({
  log,
  isOpen,
  onClose,
  getUserDisplay,
}: AuditLogDetailsModalProps) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-stone-600" />
            <h3 className="text-base font-bold text-slate-900">Audit Log Details</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Action
              </span>
              <ActionBadge action={log.action} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Timestamp
              </span>
              <span className="text-sm font-medium text-slate-800">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Audit ID
              </span>
              <span className="font-mono text-xs text-slate-700 break-all">{log.id}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Tenant ID
              </span>
              <span className="font-mono text-xs text-slate-700 break-all">{log.tenantId}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Performed By
              </span>
              <span className="text-xs font-semibold text-slate-900">
                {getUserDisplay(log.userId)}
              </span>
              {log.userId && (
                <span className="font-mono text-[10px] text-slate-400 block truncate">
                  {log.userId}
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Entity / Target
              </span>
              <span className="text-xs font-medium text-slate-900">
                {log.entity || '—'} {log.entityId ? `(${log.entityId.slice(0, 10)}...)` : ''}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> IP Address
              </span>
              <span className="font-mono text-xs text-slate-700">{log.ipAddress || '—'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" /> User Agent
              </span>
              <span className="text-xs text-slate-700 truncate block" title={log.userAgent || ''}>
                {log.userAgent || '—'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">Metadata</span>
            <div className="p-4 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
              <pre>
                {log.metadata
                  ? JSON.stringify(log.metadata, null, 2)
                  : '// No metadata provided'}
              </pre>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}