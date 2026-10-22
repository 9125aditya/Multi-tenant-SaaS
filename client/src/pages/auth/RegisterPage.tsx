import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { ApiError } from '../../types';

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error: showError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registeredSuccessMessage, setRegisteredSuccessMessage] =
    useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Invalid email address';
    }

    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        tenantId: tenantId.trim(),
      });

      const message =
        response.message ||
        'User registered successfully. Please verify your email before logging in.';

      setRegisteredSuccessMessage(message);

      success({
        title: 'Account created',
        message: 'Please verify your email before signing in.',
      });
    } catch (err) {
      const apiErr = err as ApiError;

      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }

      const message =
        apiErr.message || 'Registration failed. Please try again.';

      setErrorMessage(message);

      showError({
        title: 'Registration failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredSuccessMessage) {
    return (
      <div className="space-y-6 py-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--veyra-line)] bg-[var(--veyra-accent-soft)] text-[var(--veyra-accent)]">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--veyra-accent)]">
            Account setup
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--veyra-ink)]">
            Registration complete
          </h1>

          <p className="text-sm leading-6 text-slate-600">
            {registeredSuccessMessage}
          </p>

          <p className="text-xs leading-5 text-slate-500">
            We sent a verification link to{' '}
            <span className="font-medium text-slate-700">{email}</span>.
            You must verify your email address before signing in.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90"
          >
            Go to Sign In
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
          Workspace access
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--veyra-ink)]">
          Create your account
        </h1>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Register a new user account inside an existing tenant workspace.
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
          >
            Full Name
          </label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            placeholder="John Doe"
            className={`mt-2 block w-full rounded-lg border bg-[var(--veyra-surface)] px-3.5 py-2.5 text-sm text-[var(--veyra-ink)] placeholder-slate-400 focus:outline-none focus:ring-1 ${
              fieldErrors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-[var(--veyra-line-strong)] focus:border-[var(--veyra-ring)] focus:ring-[var(--veyra-ring)]'
            }`}
          />

          {fieldErrors.name && (
            <p className="mt-1.5 text-xs text-red-600">
              {fieldErrors.name}
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
            placeholder="john@example.com"
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
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            placeholder="At least 6 characters"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--veyra-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--veyra-surface)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Create account</span>
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="border-t border-[var(--veyra-line)] pt-5 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-stone-700 transition-colors hover:text-stone-500"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}