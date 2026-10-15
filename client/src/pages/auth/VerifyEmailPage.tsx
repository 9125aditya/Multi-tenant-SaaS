import { useEffect, useState, useRef, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailCheck,
  Send,
} from 'lucide-react';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasTriggeredRef = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  );
  const [statusMessage, setStatusMessage] = useState<string>(
    token ? 'Verifying your email address...' : 'Verification token is missing from the URL.'
  );

  // Resend verification state
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [tenantId, setTenantId] = useState(searchParams.get('tenantId') || '');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setStatusMessage('Verification token is required. Please check your verification link or request a new one below.');
      return;
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    (async () => {
      try {
        const res = await authApi.verifyEmail(token);
        setStatus('success');
        setStatusMessage(res.message || 'Email verified successfully');
      } catch (err) {
        const apiErr = err as ApiError;
        setStatus('error');
        setStatusMessage(
          apiErr.message || 'Invalid or expired verification token.'
        );
      }
    })();
  }, [token]);

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    setResendError(null);
    setResendSuccess(null);

    const errors: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Invalid email address';
    }
    if (!tenantId.trim()) {
      errors.tenantId = 'Tenant ID is required';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsResending(true);
    try {
      const res = await authApi.resendVerification({
        email: email.trim(),
        tenantId: tenantId.trim(),
      });
      setResendSuccess(
        res.message || 'If an account exists, a verification email will be sent'
      );
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
      setResendError(apiErr.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="py-8 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-slate-900">Verifying Email</h1>
          <p className="text-sm text-slate-500">{statusMessage}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="py-4 text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <MailCheck className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Email Verified</h1>
          <p className="text-sm text-slate-600">{statusMessage}</p>
        </div>
        <Link
          to="/login"
          className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Continue to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-red-900">Email Verification Issue</p>
          <p>{statusMessage}</p>
        </div>
      </div>

      {/* Resend Verification Section */}
      <div className="pt-2 border-t border-slate-200 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Resend verification link
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter your email and tenant ID to receive a fresh verification email.
          </p>
        </div>

        {resendSuccess && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{resendSuccess}</span>
          </div>
        )}

        {resendError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{resendError}</span>
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-3.5" noValidate>
          <div>
            <label htmlFor="resend-tenantId" className="block text-sm font-medium text-slate-700">
              Tenant ID
            </label>
            <input
              id="resend-tenantId"
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
            <label htmlFor="resend-email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="resend-email"
              type="email"
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

          <button
            type="submit"
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending verification email...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pt-4 border-t border-slate-200 text-center">
        <Link
          to="/login"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}