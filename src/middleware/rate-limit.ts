import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    message = 'Too many requests from this IP',
    statusCode = 429,
    headers = true,
  } = config;

  return function rateLimitMiddleware(request: NextRequest) {
    const ip = getClientIP(request);
    const now = Date.now();
    const key = `${ip}:${Math.floor(now / windowMs)}`;

    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return NextResponse.next();
    }

    if (current.count >= max) {
      // Rate limit exceeded
      const response = NextResponse.json(
        { error: message, code: 'RATE_LIMIT_EXCEEDED' },
        { status: statusCode }
      );

      if (headers) {
        response.headers.set('X-RateLimit-Limit', max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set(
          'X-RateLimit-Reset',
          new Date(current.resetTime).toISOString()
        );
        response.headers.set(
          'Retry-After',
          Math.ceil(windowMs / 1000).toString()
        );
      }

      return response;
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);

    const response = NextResponse.next();

    if (headers) {
      response.headers.set('X-RateLimit-Limit', max.toString());
      response.headers.set(
        'X-RateLimit-Remaining',
        (max - current.count).toString()
      );
      response.headers.set(
        'X-RateLimit-Reset',
        new Date(current.resetTime).toISOString()
      );
    }

    return response;
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded headers first
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address
  return request.ip || 'unknown';
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict rate limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  },

  // Standard rate limit for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests. Please try again later.',
  },

  // Relaxed rate limit for public endpoints
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests. Please try again later.',
  },
};

/**
 * Apply rate limiting based on endpoint type
 */
export function applyRateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Authentication endpoints - strict rate limiting
  if (pathname.startsWith('/api/auth') || pathname.includes('login')) {
    return createRateLimit(rateLimitConfigs.auth)(request);
  }

  // Public API endpoints - relaxed rate limiting
  if (
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/metrics')
  ) {
    return createRateLimit(rateLimitConfigs.public)(request);
  }

  // All other API endpoints - standard rate limiting
  if (pathname.startsWith('/api/')) {
    return createRateLimit(rateLimitConfigs.api)(request);
  }

  // Non-API routes - no rate limiting
  return NextResponse.next();
}
