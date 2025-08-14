"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthToken } from '@/types';
import { QRAuthService } from '@/services/qr-auth.service';
import { wsService } from '@/services/websocket.service';
import { logger } from '@/services/logging.service';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authMethod: 'qr' | 'traditional' | null;
  login: (user: User, authMethod?: 'qr' | 'traditional') => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  verifyQRToken: (token: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  authMethod: null,
  login: () => {},
  logout: () => {},
  refreshToken: async () => false,
  verifyQRToken: async () => false,
});

const STORAGE_KEYS = {
  USER: 'gkh_user_v2',
  AUTH_TOKEN: 'gkh_auth_token_v2',
  AUTH_METHOD: 'gkh_auth_method_v2',
};

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'qr' | 'traditional' | null>(null);
  const router = useRouter();
  const qrAuthService = QRAuthService.getInstance();

  // Initialize authentication state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Load user from storage
        const userRaw = localStorage.getItem(STORAGE_KEYS.USER);
        const tokenRaw = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const methodRaw = localStorage.getItem(STORAGE_KEYS.AUTH_METHOD);

        if (userRaw && tokenRaw) {
          const storedUser = JSON.parse(userRaw);
          const storedToken = JSON.parse(tokenRaw);
          const storedMethod = methodRaw as 'qr' | 'traditional' | null;

          // Verify token is still valid
          if (storedToken.expiresAt && new Date(storedToken.expiresAt) > new Date()) {
            setUser(storedUser);
            setAuthMethod(storedMethod);
          } else {
            // Token expired, try to refresh
            const refreshed = await refreshToken();
            if (!refreshed) {
              clearAuthData();
            }
          }
        }
      } catch (error) {
        logger.error('auth', 'Auth initialization failed', error instanceof Error ? error : undefined, error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Save auth data to storage
  const saveAuthData = useCallback((userData: User, token?: AuthToken, method?: 'qr' | 'traditional') => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(token));
      }
      if (method) {
        localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, method);
        setAuthMethod(method);
      }
    } catch (error) {
      logger.error('auth', 'Failed to save auth data', error instanceof Error ? error : undefined, error);
    }
  }, []);

  // Clear auth data from storage
  const clearAuthData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_METHOD);
      setUser(null);
      setAuthMethod(null);
    } catch (error) {
      logger.error('auth', 'Failed to clear auth data', error instanceof Error ? error : undefined, error);
    }
  }, []);

  // Enhanced login function with role-based redirection
  const login = useCallback((userData: User, loginMethod: 'qr' | 'traditional' = 'traditional') => {
    setUser(userData);
    
    // Generate auth token
    const token: AuthToken = {
      accessToken: `token_${Date.now()}_${Math.random().toString(36)}`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    saveAuthData(userData, token, loginMethod);

    // Role-based redirection
    const redirectPath = getRoleBasedRedirectPath(userData.role);
    router.push(redirectPath);
  }, [router, saveAuthData]);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      // Disconnect WebSocket if connected
      if (wsService.isConnected()) {
        wsService.disconnect();
      }

      // Clear auth data
      clearAuthData();

      // Redirect to login
      router.push('/login');
    } catch (error) {
      logger.error('auth', 'Logout failed', error instanceof Error ? error : undefined, error);
    }
  }, [router, clearAuthData]);

  // Token refresh function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const tokenRaw = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!tokenRaw) return false;

      const token = JSON.parse(tokenRaw);
      
      // Simulate token refresh (in real app, this would call an API)
      const newToken: AuthToken = {
        accessToken: `token_${Date.now()}_${Math.random().toString(36)}`,
        refreshToken: token.refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(newToken));
      return true;
    } catch (error) {
      logger.error('auth', 'Token refresh failed', error instanceof Error ? error : undefined, error);
      return false;
    }
  }, []);

  // QR token verification function
  const verifyQRToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await qrAuthService.verifyQRToken(
        token,
        navigator.userAgent,
        // In a real app, you'd get the actual IP address from the server
        '127.0.0.1'
      );

      if (result.isValid && result.user) {
        login(result.user, 'qr');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('auth', 'QR token verification failed', error instanceof Error ? error : undefined, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [login, qrAuthService]);

  // Helper function for role-based redirection
  const getRoleBasedRedirectPath = (role: User['role']): string => {
    switch (role) {
      case 'teacher':
        return '/teacher/dashboard';
      case 'parent':
        return '/parent/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    authMethod,
    login,
    logout,
    refreshToken,
    verifyQRToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}


