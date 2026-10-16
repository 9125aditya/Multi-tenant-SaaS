import type { Role } from '../../types';

const roleStyles: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  ADMIN: 'bg-stone-50 text-stone-700 border-stone-200',
  MANAGER: 'bg-blue-50 text-blue-700 border-blue-200',
  USER: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function RoleBadge({ role }: { role: Role }) {
  const style = roleStyles[role] || roleStyles.USER;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${style}`}
    >
      {role}
    </span>
  );
}