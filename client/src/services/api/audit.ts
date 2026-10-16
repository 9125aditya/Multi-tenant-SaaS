import { apiRequest } from './client';
import type { AuditLog } from '../../types';

export interface AuditLogParams {
  action?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  success: boolean;
  message?: string;
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export const auditApi = {
  getAuditLogs: (params: AuditLogParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.action && params.action.trim()) {
      queryParams.set('action', params.action.trim());
    }
    if (params.userId && params.userId.trim() && params.userId !== 'ALL') {
      queryParams.set('userId', params.userId.trim());
    }
    if (params.page) {
      queryParams.set('page', String(params.page));
    }
    if (params.limit) {
      queryParams.set('limit', String(params.limit));
    }

    const query = queryParams.toString();
    return apiRequest<AuditLogsResponse>(
      `/audit-logs${query ? `?${query}` : ''}`
    );
  },
  list: (params: AuditLogParams = {}) => auditApi.getAuditLogs(params),
};