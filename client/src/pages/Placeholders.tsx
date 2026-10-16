import { useParams } from 'react-router-dom';
import { ShieldCheck, Users, FileText } from 'lucide-react';

function PageShell({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: any }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-600">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="text-base font-semibold text-slate-900">Administration Interface Ready</h2>
          <p className="text-sm text-slate-600">
            This administrative view is protected by backend authorization and role checks (`ADMIN` / `SUPER_ADMIN`). Full interactive management features are queued for the upcoming implementation phase.
          </p>
        </div>
      </div>
    </div>
  );
}

export const UsersListPage = () => (
  <PageShell
    title="User Management"
    subtitle="View and manage tenant users and role assignments."
    icon={Users}
  />
);

export const UserDetailPage = () => {
  const { id } = useParams();
  return (
    <PageShell
      title={`User Details (${id})`}
      subtitle="Inspect specific user profile and access controls."
      icon={Users}
    />
  );
};

export const AuditLogsPage = () => (
  <PageShell
    title="Audit Logs"
    subtitle="Comprehensive tracking of security events, authentications, and tenant activity."
    icon={FileText}
  />
);

export const AdminUsersPage = () => <UsersListPage />;
export const AdminAuditLogsPage = () => <AuditLogsPage />;