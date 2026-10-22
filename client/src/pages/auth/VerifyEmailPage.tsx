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
import { useToast } from '../../components/ui/Toast';
import type { ApiError } from '../../types';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasTriggeredRef = useRef(false);
  const { success, error: showError } = useToast();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  );

  const [statusMessage, setStatusMessage] = useState<string>(
    token
      ? 'Verifying your email address...'
      : 'Verification token is missing from the URL.'
  );

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [tenantId, setTenantId] = useState(
    searchParams.get('tenantId') || ''
  );
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setStatusMessage(
        'Verification token is required. Please check your verification link or request a new one below.'
      );
      return;
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    (async () => {
      try {
        const res = await authApi.verifyEmail(token);

        setStatus('success');
        setStatusMessage(res.message || 'Email verified successfully');

        success({
          title: 'Email verified',
          message: 'Your email address has been verified successfully.',
        });
      } catch (err) {
        const apiErr = err as ApiError;

        const message =
          apiErr.message || 'Invalid or expired verification token.';

        setStatus('error');
        setStatusMessage(message);

        showError({
          title: 'Verification failed',
          message,
        });
      }
    })();
  }, [token, success, showError]);

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });

    setResendError(null);
    setResendSuccess(null);
  };

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

    if (Object.keys(errors).length > 0) {
      showError({
        title: 'Check your details',
        message: 'Please correct the highlighted fields and try again.',
      });
      return;
    }

    setIsResending(true);

    try {
      const res = await authApi.resendVerification({
        email: email.trim(),
        tenantId: tenantId.trim(),
      });

      const message =
        res.message ||
        'If an account exists, a verification email will be sent';

      setResendSuccess(message);

      success({
        title: 'Verification email requested',
        message:
          'If the account exists, a fresh verification email will be sent.',
      });
    } catch (err) {
      const apiErr = err as ApiError;

      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }

      const message =
        apiErr.message || 'Failed to resend verification email.';

      setResendError(message);

      showError({
        title: 'Unable to resend email',
        message,
      });
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="space-y-5 py-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--veyra-line)] bg-[var(--veyra-accent-soft)]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--veyra-accent)]" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
            Account verification
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--veyra-ink)]">
            Verifying your email
          </h1>

          <p className="text-sm leading-6 text-slate-500">
            {statusMessage}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--veyra-line)] bg-[var(--veyra-accent-soft)] text-[var(--veyra-accent)]">
          <MailCheck className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
            Account verification
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--veyra-ink)]">
            Email verified
          </h1>

          <p className="text-sm leading-6 text-slate-600">
            {statusMessage}
          </p>

          <p className="text-xs leading-5 text-slate-500">
            Your account is now ready. You can sign in using your credentials.
          </p>
        </div>

        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90"
        >
          Continue to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification error */}
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

        <div className="space-y-1">
          <p className="font-semibold text-red-900">
            Email verification issue
          </p>

          <p>{statusMessage}</p>
        </div>
      </div>

      {/* Resend verification */}
      <div className="space-y-5 border-t border-[var(--veyra-line)] pt-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
            Recovery
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--veyra-ink)]">
            Resend verification link
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Enter your email and tenant ID to receive a fresh verification
            email.
          </p>
        </div>

        {resendSuccess && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{resendSuccess}</span>
          </div>
        )}

        {resendError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{resendError}</span>
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="resend-tenantId"
              className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
            >
              Tenant ID
            </label>

            <input
              id="resend-tenantId"
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
              htmlFor="resend-email"
              className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
            >
              Email address
            </label>

            <input
              id="resend-email"
              type="email"
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

          <button
            type="submit"
            disabled={isResending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Footer */}
      <div className="border-t border-[var(--veyra-line)] pt-5 text-center">
        <Link
          to="/login"
          className="text-sm font-semibold text-stone-700 transition-colors hover:text-stone-500"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}