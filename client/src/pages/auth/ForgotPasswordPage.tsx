import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { authApi } from '../../services/api/auth';
import { useToast } from '../../components/ui/Toast';
import type { ApiError } from '../../types';

export default function ForgotPasswordPage() {
  const { success, error: showError } = useToast();

  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Invalid email address';
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
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await authApi.forgotPassword({
        email: email.trim(),
        tenantId: tenantId.trim(),
      });

      const message =
        res.message ||
        'If an account exists, a password reset link will be sent.';

      setSuccessMessage(message);

      success({
        title: 'Reset request sent',
        message: 'Check your email for the password reset instructions.',
      });
    } catch (err) {
      const apiErr = err as ApiError;

      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }

      const message =
        apiErr.message || 'Unable to process password reset request.';

      setErrorMessage(message);

      showError({
        title: 'Reset request failed',
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
            Check your email
          </h1>

          <p className="text-sm leading-6 text-slate-600">
            {successMessage}
          </p>

          <p className="text-xs leading-5 text-slate-500">
            If the account details match, you&apos;ll receive instructions to
            securely reset your password.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90"
          >
            Return to Sign In
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
          Reset your password
        </h1>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Enter your tenant ID and email address to receive a password reset
          link.
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending reset link...</span>
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              <span>Send reset link</span>
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="border-t border-[var(--veyra-line)] pt-5 text-center text-sm text-slate-600">
        Remembered your password?{' '}
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