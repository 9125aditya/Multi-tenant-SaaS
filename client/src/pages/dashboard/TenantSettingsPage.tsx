import { useEffect, useState } from 'react';
import {
  Building2,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { tenantApi } from '../../services/api/tenant';
import { useToast } from '../../components/ui/Toast';
import type { Tenant, ApiError } from '../../types';

export default function TenantSettingsPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTenant = async (showRefreshToast = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await tenantApi.getTenant();
      const data = res.data;

      setTenant(data);
      setName(data.name || '');
      setSlug(data.slug || '');

      if (showRefreshToast) {
        success({
          title: 'Tenant settings refreshed',
          message: 'The latest workspace information has been loaded.',
        });
      }
    } catch (err) {
      const apiErr = err as ApiError;

      const message =
        apiErr.status === 403
          ? 'You do not have permission to view tenant settings.'
          : apiErr.message || 'Failed to load tenant settings. Please try again.';

      setError(message);

      showError({
        title: 'Failed to load tenant settings',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const isDirty = tenant
    ? name.trim() !== tenant.name || slug.trim() !== tenant.slug
    : false;

  const isInvalid = !name.trim() || !slug.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenant || !canEdit || isInvalid || !isDirty) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await tenantApi.updateTenant(tenant.id, {
        name: name.trim(),
        slug: slug.trim(),
      });

      setTenant(res.data);
      setName(res.data.name);
      setSlug(res.data.slug);

      success({
        title: 'Tenant settings updated',
        message: 'Your workspace information was updated successfully.',
      });
    } catch (err) {
      const apiErr = err as ApiError;

      let message: string;

      if (apiErr.status === 403) {
        message = 'You do not have permission to update this tenant.';
      } else if (apiErr.status === 409) {
        message = 'Tenant slug already exists. Please choose a unique slug.';
      } else {
        message =
          apiErr.message || 'Failed to update tenant. Please try again.';
      }

      setFormError(message);

      showError({
        title: 'Update failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
        <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
        <span>Loading tenant settings...</span>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-2xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>

        <p className="text-base font-semibold text-slate-800">
          {error || 'Tenant not found.'}
        </p>

        <button
          type="button"
          onClick={() => fetchTenant(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-stone-600 text-white hover:bg-stone-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Tenant Settings
        </h1>

        <p className="text-sm text-slate-500 mt-0.5">
          Manage your organization's tenant information and identifiers.
        </p>
      </div>

      {formError && (
        <div className="flex items-center gap-2.5 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Section A: Tenant Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-stone-50 text-stone-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Organization Overview
              </h2>

              <p className="text-xs text-slate-500">
                Core system details for your current workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Tenant ID
              </span>

              <span className="font-mono text-xs text-slate-800 break-all">
                {tenant.id}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Organization Slug
              </span>

              <span className="font-mono text-xs font-semibold text-slate-800">
                {tenant.slug}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1 flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Created At
                </span>

                <span className="text-xs text-slate-700">
                  {tenant.createdAt
                    ? new Date(tenant.createdAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1 flex items-start gap-3">
              <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Updated At
                </span>

                <span className="text-xs text-slate-700">
                  {tenant.updatedAt
                    ? new Date(tenant.updatedAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Editable Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-stone-50 text-stone-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tenant Configuration
                </h2>

                <p className="text-xs text-slate-500">
                  {canEdit
                    ? 'Update your organization name and URL slug.'
                    : 'Read-only view based on your current role permissions.'}
                </p>
              </div>
            </div>

            {!canEdit && (
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                Read-Only ({user?.role})
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Organization Name
              </label>

              <input
                type="text"
                disabled={!canEdit}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError(null);
                }}
                placeholder="Enter organization name"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Organization Slug
              </label>

              <input
                type="text"
                disabled={!canEdit}
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setFormError(null);
                }}
                placeholder="enter-organization-slug"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />

              <span className="text-[11px] text-slate-400 mt-1 block">
                Used in URLs and tenant routing identifiers.
              </span>
            </div>

            {canEdit && (
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty || isInvalid}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-stone-600 hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}