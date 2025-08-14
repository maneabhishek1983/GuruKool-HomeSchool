import React from 'react';
import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/design-system/components/feedback/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'parent' | 'admin';
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  fallback
}) => {
  const { user, isLoading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return fallback || <LoadingSpinner />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    router.push('/unauthorized');
    return fallback || <div>Access denied</div>;
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

export default AuthGuard;
