import type { User } from '../types';

export function isSuperAdmin(user?: User | null): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export function isAdmin(user?: User | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

export function canManageUsers(user?: User | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

export function canViewAuditLogs(user?: User | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}