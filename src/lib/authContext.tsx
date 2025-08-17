'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  role: 'parent' | 'admin' | 'teacher';
  email: string;
  password?: string; // Add password for new users
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
  createUser: (
    userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  getAllUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Initialize with empty users array - no demo users
  useEffect(() => {
    const initializeUsers = () => {
      // Load existing users from localStorage
      const storedUsers = localStorage.getItem('allUsers');
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          // Convert date strings back to Date objects
          const usersWithDates = parsedUsers.map((u: any) => ({
            ...u,
            createdAt: new Date(u.createdAt),
            lastActive: new Date(u.lastActive),
          }));
          setAllUsers(usersWithDates);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error parsing stored users:', error);
          setAllUsers([]);
        }
      } else {
        setAllUsers([]);
      }
    };

    initializeUsers();
  }, []);

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
        // eslint-disable-next-line no-console
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const createUser = async (
    userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      // Check if user already exists
      const existingUser = allUsers.find(u => u.email === userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists.',
        };
      }

      // Create new user
      const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
        lastActive: new Date(),
      };

      // Add to users list
      const updatedUsers = [...allUsers, newUser];
      setAllUsers(updatedUsers);
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

      // eslint-disable-next-line no-console
      console.log('User created successfully:', newUser);

      return { success: true, user: newUser };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating user:', error);
      return {
        success: false,
        error: 'Failed to create user. Please try again.',
      };
    }
  };

  const getAllUsers = (): User[] => {
    return allUsers;
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user in allUsers array
      const foundUser = allUsers.find(
        u => u.email === email && u.password === password
      );

      if (foundUser) {
        // Update last active
        const updatedUser = { ...foundUser, lastActive: new Date() };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update in allUsers array
        const updatedUsers = allUsers.map(u =>
          u.id === foundUser.id ? updatedUser : u
        );
        setAllUsers(updatedUsers);
        localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

        return { success: true, user: updatedUser };
      } else {
        return {
          success: false,
          error: 'Invalid email or password. Please try again.',
        };
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login. Please try again.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        createUser,
        getAllUsers,
      }}
    >
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
