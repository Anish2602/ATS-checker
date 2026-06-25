import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, User, ApiError } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithApple: (token: string, fullName?: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount — tries /auth/session which auto-refreshes
  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.session();
      setUser(data.user ?? null);
    } catch {
      // Try a plain /auth/me as fallback
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const data = await authApi.googleAuth(credential);
    setUser(data.user);
  }, []);

  const loginWithApple = useCallback(async (token: string, fullName?: string) => {
    const data = await authApi.appleAuth(token, fullName);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    await authApi.signup({ email, password, full_name: fullName });
    // Don't set user — they need to verify email first
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear client state regardless
    }
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    loginWithApple,
    signup,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { ApiError };
