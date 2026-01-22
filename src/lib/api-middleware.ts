import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'parent' | 'teacher' | 'admin';
  name?: string;
}

/**
 * Authentication middleware for API routes
 * Verifies user is authenticated and optionally checks role
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  options?: {
    allowedRoles?: ('parent' | 'teacher' | 'admin')[];
  }
) {
  return async (request: NextRequest) => {
    try {
      // Create Supabase client
      const supabase = createRouteHandlerClient({ cookies });

      // Get authenticated user
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user profile from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !userProfile) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'User profile not found' },
          { status: 401 }
        );
      }

      // Check role-based access
      if (options?.allowedRoles && !options.allowedRoles.includes(userProfile.role)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `Access denied. Required roles: ${options.allowedRoles.join(', ')}`,
          },
          { status: 403 }
        );
      }

      // Call handler with authenticated user
      return handler(request, userProfile as AuthenticatedUser);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Require authentication without role check
 */
export function requireAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler);
}

/**
 * Require parent role
 */
export function requireParent(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ['parent'] });
}

/**
 * Require teacher role
 */
export function requireTeacher(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ['teacher'] });
}

/**
 * Require admin role
 */
export function requireAdmin(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ['admin'] });
}

/**
 * Require parent or admin role
 */
export function requireParentOrAdmin(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ['parent', 'admin'] });
}

/**
 * Require teacher or admin role
 */
export function requireTeacherOrAdmin(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ['teacher', 'admin'] });
}
