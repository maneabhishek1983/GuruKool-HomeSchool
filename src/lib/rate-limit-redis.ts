// src/lib/rate-limit-redis.ts
import { NextRequest, NextResponse } from 'next/server';

// Optional Upstash Redis REST client lazy import
async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  try {
    const { Redis } = await import('@upstash/redis');
    // @ts-ignore - types from pkg
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

const memoryStore = new Map<string, { count: number; reset: number }>();

export interface RLConfig {
  windowSec: number;
  max: number;
  prefix?: string;
}

export function withRedisRateLimit({
  windowSec,
  max,
  prefix = 'rl',
}: RLConfig) {
  return async function wrap(
    handler: (req: NextRequest) => Promise<Response> | Response
  ) {
    const redis = await getRedis();

    return async function limited(request: NextRequest) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.ip ||
        'unknown';
      const route = request.nextUrl.pathname;
      const bucket = Math.floor(Date.now() / 1000 / windowSec);
      const key = `${prefix}:${route}:${ip}:${bucket}`;

      let remaining = 0;

      if (redis) {
        // Use Redis INCR with TTL
        const txCount = await redis.incr(key);
        if (txCount === 1) {
          await redis.expire(key, windowSec);
        }
        remaining = Math.max(0, max - txCount);
        if (txCount > max) {
          const resp = NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          );
          resp.headers.set('Retry-After', String(windowSec));
          return resp;
        }
      } else {
        const now = Date.now();
        const entry = memoryStore.get(key);
        if (!entry || now > entry.reset) {
          memoryStore.set(key, { count: 1, reset: now + windowSec * 1000 });
          remaining = max - 1;
        } else {
          entry.count += 1;
          remaining = Math.max(0, max - entry.count);
          memoryStore.set(key, entry);
          if (entry.count > max) {
            const resp = NextResponse.json(
              { error: 'Too many requests' },
              { status: 429 }
            );
            resp.headers.set(
              'Retry-After',
              String(Math.ceil((entry.reset - now) / 1000))
            );
            return resp;
          }
        }
      }

      const response = await handler(request);
      try {
        // @ts-ignore
        response.headers.set('X-RateLimit-Limit', String(max));
        // @ts-ignore
        response.headers.set('X-RateLimit-Remaining', String(remaining));
      } catch {}
      return response;
    } as any;
  };
}

export async function checkRedisLimit(
  request: NextRequest,
  { windowSec, max, prefix = 'rl' }: RLConfig
): Promise<NextResponse | null> {
  const redis = await getRedis();
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.ip ||
    'unknown';
  const route = request.nextUrl.pathname;
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const key = `${prefix}:${route}:${ip}:${bucket}`;

  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    if (count > max) {
      const resp = NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
      resp.headers.set('Retry-After', String(windowSec));
      return resp;
    }
    return null;
  }

  const now = Date.now();
  const fallbackKey = `${key}`;
  const entry = memoryStore.get(fallbackKey);
  if (!entry || now > entry.reset) {
    memoryStore.set(fallbackKey, { count: 1, reset: now + windowSec * 1000 });
    return null;
  }
  entry.count += 1;
  memoryStore.set(fallbackKey, entry);
  if (entry.count > max) {
    const resp = NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
    resp.headers.set(
      'Retry-After',
      String(Math.ceil((entry.reset - now) / 1000))
    );
    return resp;
  }
  return null;
}
