import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, UserCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types';

export default function ProfilePage() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    if (newPassword === currentPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setSuccessMessage(
        res.message || 'Password changed successfully. Your session has been updated.'
      );

      // Backend increments tokenVersion and revokes sessions on password change.
      // Clear frontend auth state and redirect to login after a brief pause.
      setTimeout(() => {
        clearSession();
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
      setErrorMessage(
        apiErr.message || 'Failed to change password. Please verify your current password.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          View your account information and manage security settings.
        </p>
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="h-14 w-14 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 font-bold text-xl">
            <UserCircle2 className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {user?.name || 'Authenticated User'}
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-50 text-stone-700 border border-stone-100 px-2 py-0.5 rounded-full">
                {user?.role || 'USER'}
              </span>
            </div>
            <p className="text-sm text-slate-500 truncate">{user?.email || 'No email associated'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Role
            </span>
            <p className="mt-1 text-sm font-mono font-semibold text-slate-900">
              {user?.role || 'USER'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tenant ID
            </span>
            <p className="mt-1 text-xs font-mono font-semibold text-slate-700 truncate" title={user?.tenantId}>
              {user?.tenantId || 'N/A'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Token Version
            </span>
            <p className="mt-1 text-sm font-mono font-semibold text-slate-900">
              v{user?.tokenVersion ?? 1}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Email Status
            </span>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              {user?.emailVerifiedAt ? 'Verified' : 'Verified session'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your password securely. Changing your password will invalidate existing sessions.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg" noValidate>
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            {fieldErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            {fieldErrors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-stone-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-stone-500 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}