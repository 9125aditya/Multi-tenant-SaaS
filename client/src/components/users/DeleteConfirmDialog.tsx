import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { User } from '../../types';

interface DeleteConfirmDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  currentUserId?: string;
}

export function DeleteConfirmDialog({
  user,
  isOpen,
  onClose,
  onConfirm,
  currentUserId,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUserId;

  const handleDelete = async () => {
    if (isSelf) return;
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm(user.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">Confirm User Deletion</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isSelf ? (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <p className="font-semibold">Cannot delete your own account</p>
              <p className="mt-1 text-xs text-amber-700">
                For security reasons, you cannot delete your currently authenticated user profile from this screen.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete user <span className="font-semibold text-slate-900">{user.name || user.email}</span>?
              </p>
              <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                This action cannot be undone. All user data and access privileges will be permanently removed.
              </p>
            </>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isSelf ? 'Close' : 'Cancel'}
            </button>
            {!isSelf && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-60 transition-colors"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Delete User</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}