import { NextRequest, NextResponse } from 'next/server';
import {
  generateToken,
  validateToken,
  extractTokenFromHeaders,
} from '@/lib/csrf';

/**
 * CSRF Middleware for Next.js API routes
 */
export function csrfMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip CSRF for non-state-changing methods and public endpoints
  if (
    request.method === 'GET' ||
    request.method === 'HEAD' ||
    request.method === 'OPTIONS'
  ) {
    return NextResponse.next();
  }

  // Skip CSRF for public API endpoints that don't require authentication
  const publicEndpoints = ['/api/health', '/api/metrics'];
  if (publicEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    return NextResponse.next();
  }

  // For state-changing methods (POST, PUT, DELETE, PATCH)
  const token = extractTokenFromHeaders(request.headers);
  const cookieToken = request.cookies.get('csrf-token')?.value ?? null;

  if (!validateToken(token, cookieToken)) {
    return NextResponse.json(
      {
        error: 'CSRF token invalid or missing',
        code: 'CSRF_ERROR',
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

/**
 * CSRF Token Generator Middleware
 * Adds CSRF token to response for GET requests
 */
export function csrfTokenMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only add CSRF token for GET requests to pages that might have forms
  if (request.method === 'GET') {
    const token = generateToken();
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });
  }

  return response;
}

/**
 * Combined CSRF middleware that handles both token generation and validation
 */
export function csrfProtectionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip CSRF for static assets and public endpoints
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/metrics')
  ) {
    return NextResponse.next();
  }

  // For GET requests, generate and set CSRF token
  if (request.method === 'GET') {
    return csrfTokenMiddleware(request);
  }

  // For state-changing requests, validate CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return csrfMiddleware(request);
  }

  return NextResponse.next();
}
