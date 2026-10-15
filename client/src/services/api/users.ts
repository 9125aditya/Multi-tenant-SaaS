import { apiRequest } from './client';
import type { User } from '../../types';

export const usersApi = {
  list: (params?: URLSearchParams) =>
    apiRequest<User[]>(`/users${params ? `?${params.toString()}` : ''}`),
  getById: (id: string) =>
    apiRequest<User>(`/users/${id}`),
  update: (id: string, data: Partial<User>) =>
    apiRequest<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
};