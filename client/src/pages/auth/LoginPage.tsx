import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  Send,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types';

export default function LoginPage() {
  const { login } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnverifiedError, setIsUnverifiedError] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    '/dashboard';

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    if (!tenantId.trim()) {
      errors.tenantId = 'Tenant ID is required';
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
    setResendFeedback(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);
    setIsUnverifiedError(false);
    setResendFeedback(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
        tenantId: tenantId.trim(),
      });

      success({
        title: 'Signed in',
        message: 'Welcome back to Veyra.',
      });

      navigate(from, { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;

      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }

      if (apiErr.status === 403) {
        setIsUnverifiedError(true);
      }

      const message =
        apiErr.message ||
        'Unable to sign in. Please check your credentials.';

      setErrorMessage(message);

      showError({
        title: 'Sign-in failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim() || !tenantId.trim()) {
      showError({
        title: 'Missing information',
        message: 'Enter your email address and tenant ID first.',
      });
      return;
    }

    setIsResending(true);
    setResendFeedback(null);

    try {
      const res = await authApi.resendVerification({
        email: email.trim(),
        tenantId: tenantId.trim(),
      });

      const message =
        res.message ||
        'If an account exists, a verification email will be sent.';

      setResendFeedback(message);

      success({
        title: 'Verification email requested',
        message,
      });
    } catch (err) {
      const apiErr = err as ApiError;

      const message =
        apiErr.message || 'Failed to resend verification email.';

      setErrorMessage(message);

      showError({
        title: 'Unable to resend email',
        message,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
          Workspace access
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--veyra-ink)]">
          Sign in to Veyra
        </h1>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Enter your workspace credentials to access your tenant portal.
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <div className="min-w-0">
              <span>{errorMessage}</span>

              {isUnverifiedError && (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendVerification}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 transition-colors hover:text-stone-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending verification link...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Resend verification email</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resend confirmation */}
      {resendFeedback && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{resendFeedback}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="tenantId"
            className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
          >
            Tenant ID
          </label>

          <input
            id="tenantId"
            type="text"
            required
            value={tenantId}
            onChange={(e) => {
              setTenantId(e.target.value);
              clearFieldError('tenantId');
            }}
            placeholder="e.g. cmtkkruxe0000p7ufcihmi23c"
            className={`mt-2 block w-full rounded-lg border bg-[var(--veyra-surface)] px-3.5 py-2.5 text-sm text-[var(--veyra-ink)] placeholder-slate-400 focus:outline-none focus:ring-1 ${
              fieldErrors.tenantId
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-[var(--veyra-line-strong)] focus:border-[var(--veyra-ring)] focus:ring-[var(--veyra-ring)]'
            }`}
          />

          {fieldErrors.tenantId && (
            <p className="mt-1.5 text-xs text-red-600">
              {fieldErrors.tenantId}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            placeholder="you@company.com"
            className={`mt-2 block w-full rounded-lg border bg-[var(--veyra-surface)] px-3.5 py-2.5 text-sm text-[var(--veyra-ink)] placeholder-slate-400 focus:outline-none focus:ring-1 ${
              fieldErrors.email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-[var(--veyra-line-strong)] focus:border-[var(--veyra-ring)] focus:ring-[var(--veyra-ring)]'
            }`}
          />

          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
            >
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-stone-600 transition-colors hover:text-stone-500"
            >
              Forgot password?
            </Link>
          </div>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            placeholder="••••••••"
            className={`mt-2 block w-full rounded-lg border bg-[var(--veyra-surface)] px-3.5 py-2.5 text-sm text-[var(--veyra-ink)] placeholder-slate-400 focus:outline-none focus:ring-1 ${
              fieldErrors.password
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-[var(--veyra-line-strong)] focus:border-[var(--veyra-ring)] focus:ring-[var(--veyra-ring)]'
            }`}
          />

          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-600">
              {fieldErrors.password}
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
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Sign in</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="space-y-2 border-t border-[var(--veyra-line)] pt-5 text-center">
        <div className="text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-stone-700 transition-colors hover:text-stone-500"
          >
            Create account
          </Link>
        </div>

        <div className="text-xs text-slate-500">
          Need a new verification email?{' '}
          <Link
            to="/verify-email"
            className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-stone-600"
          >
            Resend verification
          </Link>
        </div>
      </div>
    </div>
  );
}