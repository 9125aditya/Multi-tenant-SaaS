import { X, UserCircle2 } from 'lucide-react';
import type { User } from '../../types';
import { RoleBadge } from './RoleBadge';

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-6 w-6 text-stone-600" />
            <h3 className="text-base font-bold text-slate-900">User Details</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="h-12 w-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 font-bold text-lg">
              {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">{user.name || 'Unnamed User'}</h4>
              <p className="text-sm text-slate-500">{user.email || 'No email'}</p>
            </div>
            <div className="ml-auto">
              <RoleBadge role={user.role} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                User ID
              </span>
              <span className="font-mono text-xs text-slate-700 break-all">{user.id}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Tenant ID
              </span>
              <span className="font-mono text-xs text-slate-700 break-all">{user.tenantId}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Created At
              </span>
              <span className="text-xs text-slate-700">
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Updated At
              </span>
              <span className="text-xs text-slate-700">
              {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
              </span>
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