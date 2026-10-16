import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types';

export default function ForgotPasswordPage() {
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
      setSuccessMessage(
        res.message || 'If an account exists, a password reset link will be sent'
      );
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
      setErrorMessage(
        apiErr.message || 'Unable to process password reset request.'
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
          <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-600">{successMessage}</p>
        </div>
        <div className="pt-2">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center rounded-lg bg-stone-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-500 transition-colors"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reset your password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter your tenant ID and email address to receive a password reset link.
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-stone-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-stone-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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

      <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-stone-600 hover:text-stone-500">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}