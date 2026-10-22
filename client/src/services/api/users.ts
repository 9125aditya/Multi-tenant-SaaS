import { apiRequest } from './client';
import type { User, Role } from '../../types';

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
  role?: Role;
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
  getUsers() {
    return apiRequest<UsersResponse>('/users');
  },

  getUser(id: string) {
    return apiRequest<UserDetailResponse>(`/users/${id}`);
  },

  updateUser(id: string, data: UpdateUserInput) {
    return apiRequest<UpdateUserResponse>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteUser(id: string) {
    return apiRequest<DeleteUserResponse>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};