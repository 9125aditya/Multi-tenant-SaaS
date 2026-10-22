import type { ApiError, RefreshResponse, ZodIssueItem } from '../../types';
import { tokenStorage } from '../../utils/token';

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
];

let refreshPromise: Promise<string | null> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: () => void) {
  onUnauthorizedCallback = cb;
}

/**
 * Performs one refresh-token rotation.
 *
 * The refresh token is never exposed outside the token storage/API request
 * flow. On any refresh failure, the local session is cleared.
 */
async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    tokenStorage.clear();
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenStorage.clear();
      return null;
    }

    const result = (await response.json()) as RefreshResponse;

    const accessToken = result?.data?.accessToken;
    const rotatedRefreshToken = result?.data?.refreshToken;

    if (accessToken && rotatedRefreshToken) {
      tokenStorage.setTokens(accessToken, rotatedRefreshToken);
      return accessToken;
    }

    tokenStorage.clear();
    return null;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

/**
 * Deduplicates concurrent refresh requests.
 *
 * If several API requests receive a 401 at the same time, only one refresh
 * request is sent to the backend. All callers wait for the same promise.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function parseApiError(
  status: number,
  payload: Record<string, unknown>
): ApiError {
  if (status >= 500) {
    return {
      status,
      message: 'A server error occurred. Please try again shortly.',
    };
  }

  const rawIssues = Array.isArray(payload.errors)
    ? (payload.errors as ZodIssueItem[])
    : undefined;

  const fieldErrors: Record<string, string> = {};

  if (rawIssues) {
    for (const issue of rawIssues) {
      const fieldKey = issue.path?.[0]
        ? String(issue.path[0])
        : 'form';

      if (!fieldErrors[fieldKey]) {
        fieldErrors[fieldKey] = issue.message;
      }
    }
  }

  return {
    status,
    message:
      typeof payload.message === 'string'
        ? payload.message
        : 'Request could not be completed.',
    issues: rawIssues,
    fieldErrors:
      Object.keys(fieldErrors).length > 0
        ? fieldErrors
        : undefined,
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers);

  const isFormData = options.body instanceof FormData;

  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = tokenStorage.getAccessToken();

  const isPublicAuthEndpoint = PUBLIC_AUTH_ENDPOINTS.some((path) =>
    endpoint.startsWith(path)
  );

  if (accessToken && !isPublicAuthEndpoint) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  /**
   * Protected request received 401:
   * attempt exactly one refresh + retry.
   */
  if (response.status === 401 && !isPublicAuthEndpoint && !isRetry) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      return apiRequest<T>(endpoint, options, true);
    }

    tokenStorage.clear();

    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
  }

  if (!response.ok) {
    let errorPayload: Record<string, unknown> = {};

    try {
      errorPayload = await response.json();
    } catch {
      // Use the generic API error when the response is not JSON.
    }

    throw parseApiError(response.status, errorPayload);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}