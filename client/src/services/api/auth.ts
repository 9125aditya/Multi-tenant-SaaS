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
  register(data: RegisterInput) {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: LoginInput) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refresh(refreshToken: string) {
    return apiRequest<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  verifyEmail(token: string) {
    const encodedToken = encodeURIComponent(token);

    return apiRequest<BasicApiResponse>(
      `/auth/verify-email?token=${encodedToken}`
    );
  },

  resendVerification(data: ResendVerificationInput) {
    return apiRequest<BasicApiResponse>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout(refreshToken: string) {
    return apiRequest<BasicApiResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  changePassword(data: ChangePasswordInput) {
    return apiRequest<BasicApiResponse>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  forgotPassword(data: ForgotPasswordInput) {
    return apiRequest<BasicApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resetPassword(data: ResetPasswordInput) {
    return apiRequest<BasicApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  me() {
    return apiRequest<MeResponse>('/auth/me');
  },
};