'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  role: 'parent' | 'admin' | 'teacher' | 'student';
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
  isAuthenticated: boolean;
  isLoading: boolean;
  authMethod?: 'qr' | 'traditional';
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: User['role']
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  createUser: (
    userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  getAllUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default preferences
const defaultPreferences: User['preferences'] = {
  notifications: {
    email: true,
    push: true,
    sms: false,
    inApp: true,
    frequency: 'immediate',
  },
  dashboard: {
    layout: 'detailed',
    theme: 'light',
    widgets: [],
  },
  privacy: {
    dataSharing: false,
    analytics: true,
    aiTraining: false,
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'qr' | 'traditional'>(
    'traditional'
  );

  // Fetch user profile from Supabase
  const fetchUserProfile = async (
    supabaseUser: SupabaseUser
  ): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        role: data.role as User['role'],
        email: data.email,
        preferences: data.preferences || defaultPreferences,
        createdAt: new Date(data.created_at),
        lastActive: new Date(data.last_active || data.created_at),
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          if (userProfile) {
            setUser(userProfile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        if (userProfile) {
          setUser(userProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: User['role']
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
        }
      );

      if (signUpError) {
        return {
          success: false,
          error: signUpError.message,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account.',
        };
      }

      // Create user profile in database
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            name,
            role,
            preferences: defaultPreferences,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return {
          success: false,
          error: 'Failed to create user profile.',
        };
      }

      // If teacher role, also create a teachers table record
      // This allows the teacher to appear in the teacher dashboard and be assignable
      if (role === 'teacher') {
        const { error: teacherError } = await supabase.from('teachers').insert([
          {
            user_id: authData.user.id,
            name,
            email,
            // parent_id is null for self-registered teachers
            // They can be linked to a parent later if needed
          },
        ]);

        if (teacherError) {
          // Log but don't fail signup - teacher can still use the app
          // Parent can create a linked teacher profile later if needed
          console.warn('Could not create teacher profile:', teacherError);
        }
      }

      const newUser: User = {
        id: profileData.id,
        name: profileData.name,
        role: profileData.role as User['role'],
        email: profileData.email,
        preferences: profileData.preferences || defaultPreferences,
        createdAt: new Date(profileData.created_at),
        lastActive: new Date(profileData.last_active),
      };

      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'An error occurred during signup. Please try again.',
      };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      console.log('Attempting login for:', email);

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase auth response:', {
        hasUser: !!data?.user,
        error: error?.message,
      });

      if (error) {
        console.error('Login error from Supabase:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user) {
        console.error('No user returned from Supabase auth');
        return {
          success: false,
          error: 'Login failed. Please try again.',
        };
      }

      // Fetch user profile
      console.log('Fetching user profile for ID:', data.user.id);
      const userProfile = await fetchUserProfile(data.user);

      if (!userProfile) {
        console.error('User profile not found in database');
        return {
          success: false,
          error: 'User profile not found.',
        };
      }

      console.log('User profile loaded:', userProfile.role);

      // Update last active
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.user.id);

      // Ensure teacher has a teachers table record (for self-registered teachers)
      if (userProfile.role === 'teacher') {
        const { data: existingTeacher, error: checkError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        console.log('Teacher record check:', {
          userId: data.user.id,
          existingTeacher,
          checkError: checkError?.message,
        });

        if (!existingTeacher) {
          // Create teachers record for this user
          const { data: newTeacher, error: insertError } = await supabase
            .from('teachers')
            .insert([
              {
                user_id: data.user.id,
                name: userProfile.name,
                email: userProfile.email,
              },
            ])
            .select()
            .single();

          console.log('Teacher record creation:', {
            newTeacher,
            insertError: insertError?.message,
          });
        }
      }

      setUser(userProfile);
      setAuthMethod('traditional');
      return { success: true, user: userProfile };
    } catch (error) {
      console.error('Login exception:', error);
      return {
        success: false,
        error: 'An error occurred during login. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthMethod('traditional');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createUser = async (
    userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    // For backward compatibility - redirect to signup
    return signup(
      userData.email,
      'temporary-password-123', // User should change this
      userData.name,
      userData.role
    );
  };

  const getAllUsers = (): User[] => {
    // This function is deprecated - use Supabase queries instead
    console.warn('getAllUsers() is deprecated. Use Supabase queries instead.');
    return [];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authMethod,
        login,
        logout,
        signup,
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
