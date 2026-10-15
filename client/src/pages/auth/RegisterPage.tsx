import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import type { ApiError } from '../../types';

export default function RegisterPage() {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registeredSuccessMessage, setRegisteredSuccessMessage] = useState<string | null>(null);

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
      setRegisteredSuccessMessage(
        response.message || 'User registered successfully. Please verify your email before logging in.'
      );
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        setFieldErrors(apiErr.fieldErrors);
      }
      setErrorMessage(apiErr.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredSuccessMessage) {
    return (
      <div className="space-y-6 text-center py-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Registration Complete</h1>
          <p className="text-sm text-slate-600">{registeredSuccessMessage}</p>
          <p className="text-xs text-slate-500">
            We sent a verification link to <span className="font-medium text-slate-700">{email}</span>.
            You must verify your email address before signing in.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-500 mt-1">
          Register a new user account inside an existing tenant workspace.
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
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
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
            placeholder="john@example.com"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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

      <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </div>
    </div>
  );
}