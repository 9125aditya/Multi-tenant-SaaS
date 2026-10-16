const actionColors: Record<string, string> = {
  LOGIN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LOGOUT: 'bg-slate-100 text-slate-700 border-slate-200',
  PASSWORD_RESET: 'bg-amber-50 text-amber-700 border-amber-200',
  EMAIL_VERIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
  USER_CREATED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  USER_UPDATED: 'bg-purple-50 text-purple-700 border-purple-200',
  ROLE_CHANGED: 'bg-rose-50 text-rose-700 border-rose-200',
  USER_DELETED: 'bg-red-50 text-red-700 border-red-200',
};

export function ActionBadge({ action }: { action: string }) {
  const style = actionColors[action] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${style}`}
    >
      {action}
    </span>
  );
}