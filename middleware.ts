import { NextRequest, NextResponse } from 'next/server';
import { csrfProtectionMiddleware } from '@/middleware/csrf';
import { applyRateLimit } from '@/middleware/rate-limit';

/**
 * Main middleware function that applies all security measures
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next.js internal routes
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Apply rate limiting for API routes (early exit on 429)
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }
  }

  // Always apply CSRF middleware so that GET requests receive a CSRF token cookie
  const csrfResponse = csrfProtectionMiddleware(request);
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
