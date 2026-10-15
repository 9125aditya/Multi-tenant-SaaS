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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      clearSession();
    });
  }, [clearSession]);

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
      const cached = tokenStorage.getCachedUser();

      const mergedUser: User = {
        id: meRes.user.userId,
        tenantId: meRes.user.tenantId,
        role: meRes.user.role,
        tokenVersion: meRes.user.tokenVersion,
        name: cached?.id === meRes.user.userId ? cached.name : undefined,
        email: cached?.id === meRes.user.userId ? cached.email : undefined,
      };

      tokenStorage.setCachedUser(mergedUser);
      setUser(mergedUser);
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await reloadUser();
      if (isMounted) {
        setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [reloadUser]);

  const login = useCallback(async (input: LoginInput) => {
    const res = await authApi.login(input);
    const { accessToken, refreshToken, user: loggedInUser } = res.data;

    tokenStorage.setTokens(accessToken, refreshToken);
    tokenStorage.setCachedUser(loggedInUser);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    return authApi.register(input);
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      clearSession();
      return false;
    }
    return true;
  }, [clearSession]);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Clear local session even if network logout call fails
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refresh,
        reloadUser,
        clearSession,
      }}
    >
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