import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

/**
 * Distributed Rate Limiting using Upstash Redis
 * 
 * This implementation works across multiple Vercel serverless instances
 * and survives cold starts by using Redis as the state store.
 * 
 * Features:
 * - Per-IP rate limiting
 * - Per-user rate limiting (when authenticated)
 * - Configurable limits per endpoint
 * - IP ban persistence
 * - Sliding window algorithm
 */

type Handler = (request: NextRequest) => Promise<Response> | Response;

interface RateLimitOptions {
  /**
   * Time window in milliseconds
   * @default 15 * 60 * 1000 (15 minutes)
   */
  windowMs?: number;

  /**
   * Maximum number of requests per window
   * @default 100
   */
  max?: number;

  /**
   * Key prefix for Redis keys
   * @default 'ratelimit'
   */
  keyPrefix?: string;

  /**
   * Whether to use user ID for rate limiting (requires auth)
   * @default false
   */
  useUserId?: boolean;

  /**
   * Custom key generator function
   */
  keyGenerator?: (request: NextRequest) => string;
}

const defaultOptions: Required<Omit<RateLimitOptions, 'keyGenerator'>> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyPrefix: 'ratelimit',
  useUserId: false,
};

/**
 * Get Redis client instance
 * Throws error if environment variables are not configured
 */
function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Redis configuration missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
    );
  }

  return new Redis({
    url,
    token,
  });
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check X-Forwarded-For header (set by proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the list
    const parts = forwarded.split(',');
    if (parts.length > 0 && parts[0]) {
      return parts[0].trim();
    }
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to request IP (may not be available in all environments)
  // @ts-ignore - NextRequest may expose ip property
  return (request as any).ip || 'unknown';
}

/**
 * Extract user ID from request (if authenticated)
 * This is a placeholder - implement based on your auth system
 */
async function getUserId(request: NextRequest): Promise<string | null> {
  // TODO: Implement based on your authentication system
  // Example: Extract from JWT token, session cookie, etc.
  
  // For now, return null (not implemented)
  return null;
}

/**
 * Generate rate limit key for Redis
 */
async function generateKey(
  request: NextRequest,
  options: RateLimitOptions
): Promise<string> {
  const { keyPrefix, useUserId, keyGenerator } = {
    ...defaultOptions,
    ...options,
  };

  // Use custom key generator if provided
  if (keyGenerator) {
    return `${keyPrefix}:${keyGenerator(request)}`;
  }

  // Use user ID if enabled and available
  if (useUserId) {
    const userId = await getUserId(request);
    if (userId) {
      return `${keyPrefix}:user:${userId}`;
    }
  }

  // Default: use IP address
  const ip = getClientIP(request);
  const route = request.nextUrl.pathname;
  return `${keyPrefix}:ip:${ip}:${route}`;
}

/**
 * Check if IP is banned
 */
async function isIPBanned(redis: Redis, ip: string): Promise<boolean> {
  const banKey = `ban:ip:${ip}`;
  const banned = await redis.get(banKey);
  return banned === '1';
}

/**
 * Ban an IP address
 */
async function banIP(
  redis: Redis,
  ip: string,
  durationMs: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<void> {
  const banKey = `ban:ip:${ip}`;
  await redis.set(banKey, '1', { px: durationMs });
}

/**
 * Rate limiting middleware using Redis
 * 
 * @example
 * ```typescript
 * export const GET = withRedisRateLimit({ max: 100, windowMs: 60000 })(
 *   async function GET(request: NextRequest) {
 *     return NextResponse.json({ message: 'Success' });
 *   }
 * );
 * ```
 */
export function withRedisRateLimit(options?: RateLimitOptions) {
  const { windowMs, max } = { ...defaultOptions, ...options };

  return function wrap(handler: Handler): Handler {
    return async function limited(request: NextRequest) {
      try {
        const redis = getRedisClient();
        const ip = getClientIP(request);

        // Check if IP is banned
        if (await isIPBanned(redis, ip)) {
          return NextResponse.json(
            {
              error: 'Access denied',
              code: 'IP_BANNED',
              message: 'Your IP address has been temporarily banned due to excessive requests.',
            },
            { status: 403 }
          );
        }

        // Generate rate limit key
        const key = await generateKey(request, options || {});
        const now = Date.now();
        const windowStart = now - windowMs;

        // Use Redis sorted set for sliding window
        // Score is timestamp, member is request ID
        const requestId = `${now}:${Math.random()}`;

        // Add current request
        await redis.zadd(key, { score: now, member: requestId });

        // Remove old requests outside the window
        await redis.zremrangebyscore(key, 0, windowStart);

        // Count requests in current window
        const count = await redis.zcard(key);

        // Set expiry on the key (cleanup)
        await redis.expire(key, Math.ceil(windowMs / 1000));

        // Check if limit exceeded
        if (count > max) {
          // Optional: Ban IP after repeated violations
          // Uncomment to enable automatic banning
          // if (count > max * 2) {
          //   await banIP(redis, ip);
          // }

          const resetTime = new Date(now + windowMs);
          const retryAfter = Math.ceil(windowMs / 1000);

          const response = NextResponse.json(
            {
              error: 'Too many requests',
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Rate limit exceeded. Please try again later.`,
              retryAfter,
            },
            { status: 429 }
          );

          // Add rate limit headers
          response.headers.set('X-RateLimit-Limit', String(max));
          response.headers.set('X-RateLimit-Remaining', '0');
          response.headers.set('X-RateLimit-Reset', resetTime.toISOString());
          response.headers.set('Retry-After', String(retryAfter));

          return response;
        }

        // Execute the handler
        const response = await handler(request);

        // Add rate limit headers to successful response
        try {
          const remaining = Math.max(0, max - count);
          const resetTime = new Date(now + windowMs);

          // @ts-ignore - Response could be NextResponse
          (response as NextResponse).headers.set(
            'X-RateLimit-Limit',
            String(max)
          );
          // @ts-ignore
          (response as NextResponse).headers.set(
            'X-RateLimit-Remaining',
            String(remaining)
          );
          // @ts-ignore
          (response as NextResponse).headers.set(
            'X-RateLimit-Reset',
            resetTime.toISOString()
          );
        } catch {
          // Ignore header setting errors
        }

        return response;
      } catch (error) {
        // Log error but don't block request if Redis is down
        console.error('Rate limiting error:', error);

        // Fallback: allow request but log the error
        // In production, you might want to fail closed instead
        return handler(request);
      }
    };
  };
}

/**
 * Utility function to manually check rate limit without incrementing
 */
export async function checkRateLimit(
  request: NextRequest,
  options?: RateLimitOptions
): Promise<{ limited: boolean; remaining: number; resetAt: Date }> {
  const { windowMs, max } = { ...defaultOptions, ...options };

  try {
    const redis = getRedisClient();
    const key = await generateKey(request, options || {});
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old requests
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await redis.zcard(key);
    const remaining = Math.max(0, max - count);
    const resetAt = new Date(now + windowMs);

    return {
      limited: count >= max,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      limited: false,
      remaining: max,
      resetAt: new Date(Date.now() + windowMs),
    };
  }
}

/**
 * Utility function to reset rate limit for a specific key
 * Useful for testing or manual intervention
 */
export async function resetRateLimit(
  request: NextRequest,
  options?: RateLimitOptions
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = await generateKey(request, options || {});
    await redis.del(key);
  } catch (error) {
    console.error('Rate limit reset error:', error);
  }
}
