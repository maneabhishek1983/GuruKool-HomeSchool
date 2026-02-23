import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Authentication Middleware for API Routes
 *
 * This middleware ensures that API routes are protected and only
 * accessible to authenticated users with the correct roles.
 */

type Handler = (
  request: NextRequest,
  context: AuthContext
) => Promise<Response> | Response;

interface AuthContext {
  user: {
    id: string;
    email: string;
    role: 'parent' | 'teacher' | 'admin';
  };
  supabase: ReturnType<typeof createRouteHandlerClient<Database>>;
}

interface AuthMiddlewareOptions {
  /**
   * Required roles to access this endpoint
   * If not specified, any authenticated user can access
   */
  allowedRoles?: Array<'parent' | 'teacher' | 'admin'>;

  /**
   * Whether to allow unauthenticated access
   * @default false
   */
  allowUnauthenticated?: boolean;
}

/**
 * Wrap an API route handler with authentication
 *
 * @example
 * ```typescript
 * export const GET = withAuth({ allowedRoles: ['parent', 'admin'] })(
 *   async function GET(request, { user }) {
 *     return NextResponse.json({ userId: user.id });
 *   }
 * );
 * ```
 */
export function withAuth(options: AuthMiddlewareOptions = {}) {
  const { allowedRoles, allowUnauthenticated = false } = options;

  return function wrap(
    handler: Handler
  ): (request: NextRequest) => Promise<Response> {
    return async function authenticated(request: NextRequest) {
      try {
        // Create Supabase client
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient<Database>({
          cookies: () => cookieStore,
        });

        // Get current user
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        // Check if user is authenticated
        if (!authUser || authError) {
          if (allowUnauthenticated) {
            // Allow unauthenticated access
            return handler(request, {
              user: null as any,
              supabase,
            });
          }

          return NextResponse.json(
            {
              error: 'Unauthorized',
              code: 'UNAUTHORIZED',
              message: 'You must be logged in to access this resource.',
            },
            { status: 401 }
          );
        }

        // Get user role from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();

        if (userError || !userData) {
          return NextResponse.json(
            {
              error: 'User not found',
              code: 'USER_NOT_FOUND',
              message: 'User profile not found in database.',
            },
            { status: 404 }
          );
        }

        const userRole = (userData as any).role as
          | 'parent'
          | 'teacher'
          | 'admin';

        // Check role authorization
        if (allowedRoles && !allowedRoles.includes(userRole)) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              code: 'FORBIDDEN',
              message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
            },
            { status: 403 }
          );
        }

        // Create auth context
        const context: AuthContext = {
          user: {
            id: authUser.id,
            email: authUser.email || '',
            role: userRole,
          },
          supabase,
        };

        // Call the handler with auth context
        return await handler(request, context);
      } catch (error) {
        console.error('Authentication middleware error:', error);

        return NextResponse.json(
          {
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during authentication.',
          },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Require authentication without role restrictions
 *
 * @example
 * ```typescript
 * export const GET = requireAuth(async function GET(request, { user }) {
 *   return NextResponse.json({ userId: user.id });
 * });
 * ```
 */
export function requireAuth(handler: Handler) {
  return withAuth({})(handler);
}

/**
 * Require parent role
 */
export function requireParent(handler: Handler) {
  return withAuth({ allowedRoles: ['parent'] })(handler);
}

/**
 * Require teacher role
 */
export function requireTeacher(handler: Handler) {
  return withAuth({ allowedRoles: ['teacher'] })(handler);
}

/**
 * Require admin role
 */
export function requireAdmin(handler: Handler) {
  return withAuth({ allowedRoles: ['admin'] })(handler);
}

/**
 * Require parent or admin role
 */
export function requireParentOrAdmin(handler: Handler) {
  return withAuth({ allowedRoles: ['parent', 'admin'] })(handler);
}

/**
 * Require teacher or admin role
 */
export function requireTeacherOrAdmin(handler: Handler) {
  return withAuth({ allowedRoles: ['teacher', 'admin'] })(handler);
}

/**
 * Extract user ID from path parameters
 * Useful for checking if user is accessing their own resources
 *
 * @example
 * ```typescript
 * const userId = getUserIdFromPath(request); // /api/users/[id]
 * if (userId !== context.user.id && context.user.role !== 'admin') {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function getUserIdFromPath(request: NextRequest): string | null {
  const pathParts = request.nextUrl.pathname.split('/');
  const userIdIndex = pathParts.findIndex(part => part === 'users') + 1;

  if (userIdIndex > 0 && userIdIndex < pathParts.length) {
    const userId = pathParts[userIdIndex];
    return userId || null;
  }

  return null;
}

/**
 * Check if user is accessing their own resource
 */
export function isOwnResource(
  context: AuthContext,
  resourceUserId: string
): boolean {
  return context.user.id === resourceUserId || context.user.role === 'admin';
}

/**
 * Middleware to check resource ownership
 * Returns 403 if user is not the owner and not an admin
 */
export function requireOwnership(
  context: AuthContext,
  resourceUserId: string
): NextResponse | null {
  if (!isOwnResource(context, resourceUserId)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        code: 'FORBIDDEN',
        message: 'You can only access your own resources.',
      },
      { status: 403 }
    );
  }

  return null;
}
