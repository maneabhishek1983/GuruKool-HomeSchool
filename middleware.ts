import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { csrfProtectionMiddleware } from '@/middleware/csrf';
import { applyRateLimit } from '@/middleware/rate-limit';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main middleware function that applies all security measures
 * and propagates Supabase session to server components
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next.js internal routes
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Generate request ID for correlation
  const requestId = uuidv4();

  // Create response first
  const response = NextResponse.next();

  // Add request ID header for logging correlation
  response.headers.set('X-Request-ID', requestId);

  // Propagate Supabase session using @supabase/ssr
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Refresh session if needed (this updates the cookie)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Apply rate limiting for API routes (early exit on 429)
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse.status !== 200) {
      // Copy request ID to rate limit response
      rateLimitResponse.headers.set('X-Request-ID', requestId);
      return rateLimitResponse;
    }
  }

  // Role-based route protection
  if (session) {
    // Get user role from session or users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = userData?.role;

    // Protect parent routes
    if (
      pathname.startsWith('/parent') &&
      userRole !== 'parent' &&
      userRole !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Protect teacher routes
    if (
      pathname.startsWith('/teacher') &&
      userRole !== 'teacher' &&
      userRole !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Protect admin routes
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else {
    // Redirect unauthenticated users from protected routes
    if (
      pathname.startsWith('/parent') ||
      pathname.startsWith('/teacher') ||
      pathname.startsWith('/admin')
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Apply CSRF middleware so that GET requests receive a CSRF token cookie
  const csrfResponse = csrfProtectionMiddleware(request);

  // Copy request ID to CSRF response
  csrfResponse.headers.set('X-Request-ID', requestId);

  return csrfResponse;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoint)
     * - api/metrics (metrics endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/health|api/metrics|_next/static|_next/image|favicon.ico).*)',
  ],
};
