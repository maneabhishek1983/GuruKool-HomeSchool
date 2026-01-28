import { NextRequest, NextResponse } from 'next/server';
import {
  createFormToken,
  extractTokenFromHeaders,
  generateToken,
  validateToken,
} from '@/lib/csrf';

type Handler = (
  request: NextRequest,
  context?: {
    params?: Record<string, string> | Promise<Record<string, string>>;
  }
) => Promise<Response> | Response;

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

const defaultRateLimitOptions: Required<RateLimitOptions> = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: 'api',
};

/**
 * Face Verification Rate Limiting Configuration
 * SECURITY CRITICAL: Prevents brute-force attacks on face matching
 *
 * Default: 10 verification attempts per minute per teacher
 * This is per-teacher, not per-IP, to prevent legitimate teachers
 * from being blocked when sharing networks
 */
export const FACE_VERIFY_RATE_LIMIT: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.FACE_VERIFY_RATE_LIMIT || '10', 10),
  keyPrefix: 'face:verify',
};

/**
 * Face Enrollment Rate Limiting Configuration
 * Prevents rapid re-enrollment attempts
 */
export const FACE_ENROLL_RATE_LIMIT: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyPrefix: 'face:enroll',
};

// In-memory store for rate limiting per route; prefer Redis in production
const routeRateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Extract client IP address from request
 * Exported for use in audit logging
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    if (parts.length > 0 && parts[0]) {
      return parts[0].trim();
    }
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  // @ts-ignore - NextRequest may expose ip
  return (request as any).ip || 'unknown';
}

/**
 * Extract device info from request headers
 * Used for audit logging
 */
export function getDeviceInfo(request: NextRequest): Record<string, unknown> {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const acceptLanguage = request.headers.get('accept-language') || 'unknown';

  return {
    userAgent,
    acceptLanguage,
    timestamp: new Date().toISOString(),
  };
}

export function withRateLimit(options?: RateLimitOptions) {
  const { windowMs, max, keyPrefix } = {
    ...defaultRateLimitOptions,
    ...options,
  };

  return function wrap(handler: Handler): Handler {
    return async function limited(
      request: NextRequest,
      context?: {
        params?: Record<string, string> | Promise<Record<string, string>>;
      }
    ) {
      const ip = getClientIP(request);
      const route = request.nextUrl.pathname;
      const bucket = Math.floor(Date.now() / windowMs);
      const key = `${keyPrefix}:${route}:${ip}:${bucket}`;

      const entry = routeRateLimitStore.get(key);
      if (!entry) {
        routeRateLimitStore.set(key, {
          count: 1,
          resetTime: Date.now() + windowMs,
        });
      } else {
        if (entry.count >= max) {
          const resp = NextResponse.json(
            { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
            { status: 429 }
          );
          resp.headers.set('X-RateLimit-Limit', String(max));
          resp.headers.set('X-RateLimit-Remaining', '0');
          resp.headers.set(
            'X-RateLimit-Reset',
            new Date(entry.resetTime).toISOString()
          );
          resp.headers.set(
            'Retry-After',
            String(Math.ceil((entry.resetTime - Date.now()) / 1000))
          );
          return resp;
        }
        entry.count += 1;
        routeRateLimitStore.set(key, entry);
      }

      const response = await handler(request, context);
      try {
        // @ts-ignore - Response could be NextResponse
        (response as NextResponse).headers.set(
          'X-RateLimit-Limit',
          String(max)
        );
        // Compute remaining roughly; read again
        const current = routeRateLimitStore.get(key);
        const remaining = current ? Math.max(0, max - current.count) : max - 1;
        // @ts-ignore
        (response as NextResponse).headers.set(
          'X-RateLimit-Remaining',
          String(remaining)
        );
        // @ts-ignore
        (response as NextResponse).headers.set(
          'X-RateLimit-Reset',
          new Date(
            routeRateLimitStore.get(key)?.resetTime || Date.now()
          ).toISOString()
        );
      } catch {}
      return response;
    };
  };
}

export function withCSRFProtection(handler: Handler): Handler {
  return async function secured(
    request: NextRequest,
    context?: {
      params?: Record<string, string> | Promise<Record<string, string>>;
    }
  ) {
    // For GET/HEAD: ensure CSRF cookie exists
    if (request.method === 'GET' || request.method === 'HEAD') {
      const hasCookie = !!request.cookies.get('csrf-token')?.value;
      if (!hasCookie) {
        const token = generateToken();
        const resp = await handler(request, context);
        try {
          // @ts-ignore
          (resp as NextResponse).cookies.set('csrf-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24,
          });
        } catch {}
        return resp;
      }
      return handler(request, context);
    }

    // For state-changing: validate header token matches cookie
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const headerToken = extractTokenFromHeaders(request.headers);
      const cookieToken = request.cookies.get('csrf-token')?.value || null;
      if (!validateToken(headerToken, cookieToken)) {
        return NextResponse.json(
          { error: 'CSRF token invalid or missing', code: 'CSRF_ERROR' },
          { status: 403 }
        );
      }
    }

    return handler(request, context);
  };
}
