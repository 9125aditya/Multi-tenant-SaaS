import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  User,
  LoginInput,
  RegisterInput,
  RegisterResponse,
} from '../types';
import { authApi } from '../services/api/auth';
import {
  refreshAccessToken,
  setOnUnauthorizedCallback,
} from '../services/api/client';
import { tokenStorage } from '../utils/token';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  reloadUser: () => Promise<void>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Clears all local authentication state.
   *
   * This is intentionally safe to call from anywhere in the auth lifecycle:
   * expired sessions, failed refreshes, logout, or failed user restoration.
   */
  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  /**
   * Any API-level unauthorized response should invalidate the local session.
   */
  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      clearSession();
    });
  }, [clearSession]);

  /**
   * Restores the authenticated user from the existing token state.
   *
   * If only a refresh token exists, rotate it before requesting /me.
   * The user profile is reconstructed using the authoritative /me response
   * while preserving cached name/email information when available.
   */
  const reloadUser = useCallback(async () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (!accessToken && !refreshToken) {
      clearSession();
      return;
    }

    try {
      if (!accessToken && refreshToken) {
        const rotated = await refreshAccessToken();

        if (!rotated) {
          clearSession();
          return;
        }
      }

      const meRes = await authApi.me();
      const cachedUser = tokenStorage.getCachedUser();

      const mergedUser: User = {
        id: meRes.user.userId,
        tenantId: meRes.user.tenantId,
        role: meRes.user.role,
        tokenVersion: meRes.user.tokenVersion,
        name:
          cachedUser?.id === meRes.user.userId
            ? cachedUser.name
            : undefined,
        email:
          cachedUser?.id === meRes.user.userId
            ? cachedUser.email
            : undefined,
      };

      tokenStorage.setCachedUser(mergedUser);
      setUser(mergedUser);
    } catch {
      clearSession();
    }
  }, [clearSession]);

  /**
   * Restore the session once when the provider mounts.
   */
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      await reloadUser();

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [reloadUser]);

  /**
   * Authenticate the user and persist the returned token pair.
   */
  const login = useCallback(async (input: LoginInput) => {
    const res = await authApi.login(input);
    const {
      accessToken,
      refreshToken,
      user: loggedInUser,
    } = res.data;

    tokenStorage.setTokens(accessToken, refreshToken);
    tokenStorage.setCachedUser(loggedInUser);
    setUser(loggedInUser);
  }, []);

  /**
   * Registration intentionally does not create a local session.
   */
  const register = useCallback(async (input: RegisterInput) => {
    return authApi.register(input);
  }, []);

  /**
   * Explicitly refresh the access token.
   */
  const refresh = useCallback(async (): Promise<boolean> => {
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      clearSession();
      return false;
    }

    return true;
  }, [clearSession]);

  /**
   * Revoke the refresh session server-side when possible,
   * then always clear the local session.
   */
  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Local session must still be cleared if the network request fails.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    refresh,
    reloadUser,
    clearSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}