import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, LogIn, Send } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types';

export default function LoginPage() {
  const { login } = useAuth();
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
      navigate(from, { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
      if (apiErr.status === 403) {
        setIsUnverifiedError(true);
      }
      setErrorMessage(
        apiErr.message || 'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim() || !tenantId.trim()) return;
    setIsResending(true);
    setResendFeedback(null);
    try {
      const res = await authApi.resendVerification({
        email: email.trim(),
        tenantId: tenantId.trim(),
      });
      setResendFeedback(
        res.message || 'If an account exists, a verification email will be sent'
      );
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sign in to your account</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter your workspace credentials to access your tenant portal.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 space-y-2"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
          {isUnverifiedError && (
            <div className="pl-6 pt-1">
              <button
                type="button"
                disabled={isResending}
                onClick={handleResendVerification}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-60"
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
      )}

      {resendFeedback && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{resendFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="tenantId" className="block text-sm font-medium text-slate-700">
            Tenant ID
          </label>
          <input
            id="tenantId"
            type="text"
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="e.g. cmtkkruxe0000p7ufcihmi23c"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {fieldErrors.tenantId && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.tenantId}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
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

      <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600 space-y-2">
        <div>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Create account
          </Link>
        </div>
        <div className="text-xs">
          Need a new verification email?{' '}
          <Link to="/verify-email" className="font-medium text-slate-700 hover:text-indigo-600 underline">
            Resend verification
          </Link>
        </div>
      </div>
    </div>
  );
}