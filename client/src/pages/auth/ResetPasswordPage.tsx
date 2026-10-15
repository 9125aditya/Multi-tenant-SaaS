import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  // Kept only in component memory via URL search params — never persisted in localStorage
  const token = searchParams.get('token');

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
          className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-900">Missing Reset Token</p>
            <p>
              No password reset token was found in the URL. Please open the exact link from your password reset email or request a new one.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            to="/forgot-password"
            className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Request New Reset Link
          </Link>
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
      setSuccessMessage(
        res.message || 'Password reset successfully. Please log in again.'
      );
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
      setErrorMessage(
        apiErr.message || 'Invalid or expired password reset token.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="space-y-6 text-center py-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Password Reset Complete</h1>
          <p className="text-sm text-slate-600">{successMessage}</p>
        </div>
        <div className="pt-2">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Choose a new password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter and confirm your new password below.
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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

      <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}