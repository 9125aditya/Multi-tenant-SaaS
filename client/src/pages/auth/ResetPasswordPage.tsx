import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { authApi } from '../../services/api/auth';
import { useToast } from '../../components/ui/Toast';
import type { ApiError } from '../../types';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  // Kept only in component memory via URL search params — never persisted in localStorage
  const token = searchParams.get('token');
  const { success, error: showError } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!token) {
    return (
      <div className="space-y-6">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="space-y-1">
            <p className="font-semibold text-red-900">
              Missing reset token
            </p>

            <p>
              No password reset token was found in the URL. Please open the
              exact link from your password reset email or request a new one.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90"
          >
            Request New Reset Link
          </Link>

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--veyra-line-strong)] bg-[var(--veyra-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-ink)] transition-colors hover:bg-[var(--veyra-accent-soft)]"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await authApi.resetPassword({
        token,
        newPassword,
      });

      const message =
        res.message ||
        'Password reset successfully. Please log in again.';

      setSuccessMessage(message);

      success({
        title: 'Password reset',
        message: 'Your password has been updated successfully.',
      });
    } catch (err) {
      const apiErr = err as ApiError;

      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }

      const message =
        apiErr.message || 'Invalid or expired password reset token.';

      setErrorMessage(message);

      showError({
        title: 'Password reset failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="space-y-6 py-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--veyra-line)] bg-[var(--veyra-accent-soft)] text-[var(--veyra-accent)]">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
            Password recovery
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--veyra-ink)]">
            Password reset complete
          </h1>

          <p className="text-sm leading-6 text-slate-600">
            {successMessage}
          </p>

          <p className="text-xs leading-5 text-slate-500">
            Your old password is no longer valid. Sign in using your new
            password to continue.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
          Password recovery
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--veyra-ink)]">
          Choose a new password
        </h1>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Enter and confirm your new password below.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              <span>Reset Password</span>
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="border-t border-[var(--veyra-line)] pt-5 text-center text-sm text-slate-600">
        <Link
          to="/login"
          className="font-semibold text-stone-700 transition-colors hover:text-stone-500"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}