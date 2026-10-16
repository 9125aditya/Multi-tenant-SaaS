import { apiRequest } from './client';
import type { Tenant } from '../../types';

export interface TenantResponse {
  success: boolean;
  message?: string;
  data: Tenant;
}

export interface UpdateTenantPayload {
  name?: string;
  slug?: string;
}

export const tenantApi = {
  getTenant: () => {
    return apiRequest<TenantResponse>('/tenants');
  },
  updateTenant: (tenantId: string, data: UpdateTenantPayload) => {
    return apiRequest<TenantResponse>(`/tenants/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};