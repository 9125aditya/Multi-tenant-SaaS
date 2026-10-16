import { apiRequest } from './client';
import type { User } from '../../types';

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface UserDetailResponse {
  success: boolean;
  data: User;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export const usersApi = {
  getUsers: () => apiRequest<UsersResponse>('/users'),
  getUser: (id: string) => apiRequest<UserDetailResponse>(`/users/${id}`),
  updateUser: (id: string, data: UpdateUserInput) =>
    apiRequest<UpdateUserResponse>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    apiRequest<DeleteUserResponse>(`/users/${id}`, {
      method: 'DELETE',
    }),
};