import { cookies } from 'next/headers';
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Get Supabase client for Server Components
 * Uses cookies for session management via @supabase/ssr
 */
export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}

/**
 * Get Supabase client for Route Handlers (API routes)
 * Uses cookies for session management via @supabase/ssr
 */
export function getSupabaseRouteHandler() {
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
}

/**
 * Get Supabase Admin client (server-side only)
 * Bypasses RLS - use with caution and proper authorization checks
 *
 * SECURITY: This client has full database access. Always verify:
 * 1. User authentication before operations
 * 2. User authorization for the specific action
 * 3. Input validation and sanitization
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get current user from server context
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get current user with role from server context
 * Returns null if not authenticated
 */
export async function getCurrentUserWithRole() {
  const supabase = getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    user,
    role: userData?.role as 'parent' | 'teacher' | 'admin' | null,
  };
}

/**
 * Server-side authorization check
 * Throws error if user is not authenticated or not authorized
 */
export async function requireAuth(
  allowedRoles?: Array<'parent' | 'teacher' | 'admin'>
) {
  const userWithRole = await getCurrentUserWithRole();

  if (!userWithRole) {
    throw new Error('Unauthorized - No active session');
  }

  if (
    allowedRoles &&
    userWithRole.role &&
    !allowedRoles.includes(userWithRole.role)
  ) {
    throw new Error(
      `Forbidden - User role '${userWithRole.role}' not authorized. Required: ${allowedRoles.join(', ')}`
    );
  }

  return userWithRole;
}
