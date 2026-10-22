import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  KeyRound,
  Loader2,
  UserCircle2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types';

export default function ProfilePage() {
  const { user, clearSession } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }

    if (newPassword === currentPassword && newPassword.length > 0) {
      errors.newPassword =
        'New password must be different from current password';
    }

    if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });

    setErrorMessage(null);
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      success({
        title: 'Password changed',
        message:
          res.message ||
          'Your password was changed successfully. You will be signed out of this session.',
      });

      /*
       * The backend increments tokenVersion and revokes existing sessions
       * after a successful password change.
       *
       * Clear the frontend auth state and redirect to login after a short
       * delay so the user has time to see the success toast.
       */
      setTimeout(() => {
        clearSession();
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      const apiErr = err as ApiError;

      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }

      const message =
        apiErr.message ||
        'Failed to change password. Please verify your current password.';

      setErrorMessage(message);

      showError({
        title: 'Password change failed',
        message,
      });

      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
          Account
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--veyra-ink)] sm:text-3xl">
          Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View your account information and manage security settings.
        </p>
      </div>

      {/* User Information Card */}
      <section className="overflow-hidden rounded-xl border border-[var(--veyra-line)] bg-[var(--veyra-surface)] shadow-sm">
        <div className="border-b border-[var(--veyra-line)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--veyra-line)] bg-[var(--veyra-paper)] text-[var(--veyra-accent)]">
              <UserCircle2 className="h-8 w-8" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--veyra-ink)]">
                  {user?.name || 'Authenticated User'}
                </h2>

                <span className="rounded-full border border-[var(--veyra-line)] bg-[var(--veyra-paper)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--veyra-ink-soft)]">
                  {user?.role || 'USER'}
                </span>
              </div>

              <p className="truncate text-sm text-slate-500">
                {user?.email || 'No email associated'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Role
              </span>

              <p className="mt-1 font-mono text-sm font-semibold text-[var(--veyra-ink)]">
                {user?.role || 'USER'}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Tenant ID
              </span>

              <p
                className="mt-1 truncate font-mono text-xs font-semibold text-[var(--veyra-ink-soft)]"
                title={user?.tenantId}
              >
                {user?.tenantId || 'N/A'}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Token Version
              </span>

              <p className="mt-1 font-mono text-sm font-semibold text-[var(--veyra-ink)]">
                v{user?.tokenVersion ?? 1}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Email Status
              </span>

              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--veyra-ink)]">
                <ShieldCheck className="h-4 w-4" />
                {user?.emailVerifiedAt ? 'Verified' : 'Verified session'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="overflow-hidden rounded-xl border border-[var(--veyra-line)] bg-[var(--veyra-surface)] shadow-sm">
        <div className="border-b border-[var(--veyra-line)] p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-paper)] p-2.5 text-[var(--veyra-accent)]">
              <KeyRound className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--veyra-ink)]">
                Change Password
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Update your password securely. Changing your password will
                invalidate existing sessions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={handlePasswordChange}
            className="max-w-lg space-y-5"
            noValidate
          >
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
              >
                Current Password
              </label>

              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearFieldError('currentPassword');
                }}
                placeholder="••••••••"
                className={`mt-2 block w-full rounded-lg border bg-[var(--veyra-surface)] px-3.5 py-2.5 text-sm text-[var(--veyra-ink)] placeholder-slate-400 focus:outline-none focus:ring-1 ${
                  fieldErrors.currentPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-[var(--veyra-line-strong)] focus:border-[var(--veyra-ring)] focus:ring-[var(--veyra-ring)]'
                }`}
              />

              {fieldErrors.currentPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {fieldErrors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
              >
                New Password
              </label>

              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearFieldError('newPassword');
                }}
                placeholder="At least 6 characters"
                className={`mt-2 block w-full rounded-lg border bg-[var(--veyra-surface)] px-3.5 py-2.5 text-sm text-[var(--veyra-ink)] placeholder-slate-400 focus:outline-none focus:ring-1 ${
                  fieldErrors.newPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-[var(--veyra-line-strong)] focus:border-[var(--veyra-ring)] focus:ring-[var(--veyra-ring)]'
                }`}
              />

              {fieldErrors.newPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
              >
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                placeholder="Re-enter new password"
                className={`mt-2 block w-full rounded-lg border bg-[var(--veyra-surface)] px-3.5 py-2.5 text-sm text-[var(--veyra-ink)] placeholder-slate-400 focus:outline-none focus:ring-1 ${
                  fieldErrors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-[var(--veyra-line-strong)] focus:border-[var(--veyra-ring)] focus:ring-[var(--veyra-ring)]'
                }`}
              />

              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="border-t border-[var(--veyra-line)] pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-xs transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>
          </form>

          <div className="mt-6 flex items-start gap-2 border-t border-[var(--veyra-line)] pt-4 text-xs text-slate-500">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <p>
              For security, changing your password signs out existing sessions
              and requires you to authenticate again.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}