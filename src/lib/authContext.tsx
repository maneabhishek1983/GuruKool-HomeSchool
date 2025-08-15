'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  role: 'parent' | 'admin' | 'teacher';
  email: string;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    };
    dashboard: {
      layout: 'compact' | 'detailed';
      theme: 'light' | 'dark';
      widgets: string[];
    };
    privacy: {
      dataSharing: boolean;
      analytics: boolean;
      aiTraining: boolean;
    };
    accessibility: {
      fontSize: 'small' | 'medium' | 'large';
      highContrast: boolean;
      reducedMotion: boolean;
      screenReader: boolean;
    };
  };
  createdAt: Date;
  lastActive: Date;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Convert date strings back to Date objects
        parsedUser.createdAt = new Date(parsedUser.createdAt);
        parsedUser.lastActive = new Date(parsedUser.lastActive);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo credentials validation - only parent and admin
      if (email === 'parent@example.com' && password === 'parent123') {
        const userData: User = {
          id: 'parent-1',
          name: 'Jane Parent',
          role: 'parent',
          email: 'parent@example.com',
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: true,
              inApp: true,
              frequency: 'immediate',
            },
            dashboard: {
              layout: 'compact',
              theme: 'light',
              widgets: ['sessions', 'progress', 'notifications'],
            },
            privacy: {
              dataSharing: false,
              analytics: true,
              aiTraining: true,
            },
            accessibility: {
              fontSize: 'medium',
              highContrast: false,
              reducedMotion: false,
              screenReader: false,
            },
          },
          createdAt: new Date(),
          lastActive: new Date(),
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else if (email === 'admin@example.com' && password === 'admin123') {
        const userData: User = {
          id: 'admin-1',
          name: 'Admin User',
          role: 'admin',
          email: 'admin@example.com',
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: true,
              inApp: true,
              frequency: 'immediate',
            },
            dashboard: {
              layout: 'detailed',
              theme: 'light',
              widgets: [
                'sessions',
                'analytics',
                'notifications',
                'users',
                'system',
              ],
            },
            privacy: {
              dataSharing: true,
              analytics: true,
              aiTraining: true,
            },
            accessibility: {
              fontSize: 'medium',
              highContrast: false,
              reducedMotion: false,
              screenReader: false,
            },
          },
          createdAt: new Date(),
          lastActive: new Date(),
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        return {
          success: false,
          error:
            'Invalid credentials. Please use demo accounts: parent@example.com/parent123 or admin@example.com/admin123',
        };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
