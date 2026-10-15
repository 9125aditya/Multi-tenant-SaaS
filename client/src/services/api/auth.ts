import { apiRequest } from './client';
import type {
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  RefreshResponse,
  MeResponse,
  BasicApiResponse,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../../types';

export const authApi = {
  register: (data: RegisterInput) =>
    apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginInput) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    apiRequest<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  verifyEmail: (token: string) =>
    apiRequest<BasicApiResponse>(
      `/auth/verify-email?token=${encodeURIComponent(token)}`
    ),

  resendVerification: (data: ResendVerificationInput) =>
    apiRequest<BasicApiResponse>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    apiRequest<BasicApiResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  changePassword: (data: ChangePasswordInput) =>
    apiRequest<BasicApiResponse>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: ForgotPasswordInput) =>
    apiRequest<BasicApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: ResetPasswordInput) =>
    apiRequest<BasicApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiRequest<MeResponse>('/auth/me'),
};