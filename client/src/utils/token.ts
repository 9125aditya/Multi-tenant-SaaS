import type { User } from '../types';

const ACCESS_TOKEN_KEY = 'saas_access_token';
const REFRESH_TOKEN_KEY = 'saas_refresh_token';
const USER_CACHE_KEY = 'saas_user_cache';

let memoryAccessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);

export const tokenStorage = {
  getAccessToken(): string | null {
    return memoryAccessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    memoryAccessToken = token;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getCachedUser(): User | null {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  setCachedUser(user: User): void {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  },

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },

  clear(): void {
    memoryAccessToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
  },
};