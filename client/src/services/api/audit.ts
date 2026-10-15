import { apiRequest } from './client';
import type { AuditLog } from '../../types';

export interface AuditFilterParams {
  action?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  success: boolean;
  message?: string;
  data: AuditLog[];
  total?: number;
  page?: number;
  limit?: number;
}

export const auditApi = {
  list: (filters: AuditFilterParams = {}) => {
    const params = new URLSearchParams();
    if (filters.action) params.set('action', filters.action);
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    return apiRequest<AuditLogsResponse>(
      `/audit-logs${query ? `?${query}` : ''}`
    );
  },
};