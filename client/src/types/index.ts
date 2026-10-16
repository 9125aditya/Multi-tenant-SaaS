export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: Role;
  tenantId: string;
  tokenVersion?: number;
  emailVerifiedAt?: string | null;
  createdAt?: string;
}

export interface MeResponse {
  success: boolean;
  message: string;
  user: {
    userId: string;
    tenantId: string;
    role: Role;
    tokenVersion: number;
  };
}

export interface LoginInput {
  email: string;
  password: string;
  tenantId: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  tenantId: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ZodIssueItem {
  path: (string | number)[];
  message: string;
  code?: string;
}

export interface ApiError {
  status: number;
  message: string;
  issues?: ZodIssueItem[];
  fieldErrors?: Record<string, string>;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface BasicApiResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationInput {
  email: string;
  tenantId: string;
}

export interface ForgotPasswordInput {
  email: string;
  tenantId: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}