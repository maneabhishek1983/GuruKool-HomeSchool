'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'parent' | 'teacher' | 'admin';

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  fallbackPath?: string;
}

/**
 * Client-side auth guard component
 * Protects routes based on authentication and role requirements
 */
export function AuthGuard({
  children,
  allowedRoles,
  requireAuth = true,
  fallbackPath = '/',
}: AuthGuardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (requireAuth) {
            console.log('No session, redirecting to login');
            router.replace(fallbackPath);
            return;
          }
          setLoading(false);
          setAuthorized(true);
          return;
        }

        setUser(session.user);

        // Get user role from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          router.replace(fallbackPath);
          return;
        }

        const role = userData?.role as UserRole;
        setUserRole(role);

        // Check role authorization
        if (allowedRoles && !allowedRoles.includes(role)) {
          console.log(
            'User role not authorized:',
            role,
            'Allowed:',
            allowedRoles
          );
          // Redirect to role-appropriate dashboard
          const roleDashboard = getRoleDashboard(role);
          router.replace(roleDashboard);
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth guard error:', error);
        router.replace(fallbackPath);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && requireAuth) {
        router.replace(fallbackPath);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, allowedRoles, requireAuth, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push(fallbackPath)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Get dashboard path for a given role
 */
function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'parent':
      return '/parent/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

/**
 * Hook to get current user and role
 */
export function useAuth() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setRole(userData?.role as UserRole);
      }

      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, role, loading, isAuthenticated: !!user };
}
