'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/authContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'parent' | 'admin';
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requiredRole,
  fallback,
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const router = useRouter();

  if (isLoading) {
    return fallback || null;
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return fallback || null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    router.replace('/');
    return fallback || null;
  }

  return <>{children}</>;
}

export default AuthGuard;

('use client');

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import { User } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: User['role'];
  fallbackPath?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  fallbackPath = '/login',
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated, authMethod } = useAuthContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-neutral-600">Verifying authentication...</p>
        </motion.div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <motion.div
          className="max-w-md mx-auto text-center space-y-6 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">🔐</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Authentication Required
            </h1>
            <p className="text-neutral-600 mb-6">
              Please sign in to access this page. You can use QR code for quick
              authentication.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={fallbackPath}
              className="block w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200"
            >
              Sign In
            </Link>

            <Link
              href="/"
              className="block w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors duration-200"
            >
              Go Home
            </Link>
          </div>

          <div className="text-xs text-neutral-500">
            <p>Secure authentication powered by AI</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-error-50 via-white to-warning-50">
        <motion.div
          className="max-w-md mx-auto text-center space-y-6 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-error-800 mb-2">
              Access Denied
            </h1>
            <p className="text-error-600 mb-6">
              You don&apos;t have permission to access this page. Required role:{' '}
              {requiredRole}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={getRoleBasedDashboard(user.role)}
              className="block w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="block w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors duration-200"
            >
              Go Home
            </Link>
          </div>

          <div className="text-xs text-neutral-500">
            <p>
              Logged in as: {user.name} ({user.role})
            </p>
            {authMethod && (
              <p>
                Authentication method:{' '}
                {authMethod === 'qr' ? 'QR Code' : 'Traditional'}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // User is authenticated and has required role
  return <>{children}</>;
}

// Helper function to get role-based dashboard path
function getRoleBasedDashboard(role: User['role']): string {
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
}

/**
 * Higher-order component for role-based route protection
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: User['role']
) {
  return function GuardedComponent(props: P) {
    return (
      <AuthGuard requiredRole={requiredRole}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuthContext();

  const hasRole = (role: User['role']) => {
    return isAuthenticated && user?.role === role;
  };

  const hasAnyRole = (roles: User['role'][]) => {
    return isAuthenticated && user && roles.includes(user.role);
  };

  const canAccess = (requiredRole?: User['role']) => {
    if (!requiredRole) {
      return isAuthenticated;
    }
    return hasRole(requiredRole);
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    canAccess,
    isTeacher: hasRole('teacher'),
    isParent: hasRole('parent'),
    isAdmin: hasRole('admin'),
  };
}
