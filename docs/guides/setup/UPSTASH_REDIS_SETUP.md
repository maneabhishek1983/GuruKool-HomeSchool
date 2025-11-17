# Upstash Redis Setup Guide

## Step 1: Create Upstash Account

1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up with GitHub or email
3. Verify your email

## Step 2: Create Redis Database

1. Click **"Create Database"**
2. Configure:
   - **Name:** `gurukool-rate-limiting`
   - **Type:** Regional (cheaper) or Global (better latency worldwide)
   - **Region:** Choose closest to your Vercel region (e.g., `us-east-1`)
   - **TLS:** ✅ Enabled (default)
   - **Eviction:** `noeviction` (recommended for rate limiting)

3. Click **"Create"**

## Step 3: Get Connection Details

After creation, copy:

```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

## Step 4: Add to Environment Variables

### Local Development (`.env.local`)

```bash
# Add to .env.local (create if doesn't exist)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### Vercel Production

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://your-db.upstash.io`
   - **Environments:** Production, Preview, Development

3. Add:
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** `your_token_here`
   - **Environments:** Production, Preview, Development

## Step 5: Install Upstash Redis SDK

```bash
npm install @upstash/redis
```

## Step 6: Implement Redis Rate Limiting

### Create `src/lib/rate-limit-redis.ts`

```typescript
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Check rate limit using Redis
 * Uses sliding window algorithm for accurate rate limiting
 */
export async function checkRateLimit(
  identifier: string, // IP address or user ID
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, max, keyPrefix = 'ratelimit' } = config;

  const now = Date.now();
  const windowStart = now - windowMs;
  const key = `${keyPrefix}:${identifier}`;

  try {
    // Use Redis sorted set for sliding window
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await redis.zcard(key);

    if (count >= max) {
      // Rate limit exceeded
      const oldestEntry = await redis.zrange(key, 0, 0, { withScores: true });
      const reset =
        oldestEntry.length > 0
          ? parseInt(oldestEntry[1] as string) + windowMs
          : now + windowMs;

      return {
        success: false,
        limit: max,
        remaining: 0,
        reset,
      };
    }

    // Add current request with timestamp as score
    await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });

    // Set expiry on key (cleanup)
    await redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      success: true,
      limit: max,
      remaining: max - (count + 1),
      reset: now + windowMs,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fail open: allow request if Redis is down
    return {
      success: true,
      limit: max,
      remaining: max - 1,
      reset: now + windowMs,
    };
  }
}

/**
 * Reset rate limit for a specific identifier (admin use)
 */
export async function resetRateLimit(
  identifier: string,
  keyPrefix = 'ratelimit'
): Promise<void> {
  const key = `${keyPrefix}:${identifier}`;
  await redis.del(key);
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, max, keyPrefix = 'ratelimit' } = config;
  const now = Date.now();
  const windowStart = now - windowMs;
  const key = `${keyPrefix}:${identifier}`;

  try {
    // Clean up old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await redis.zcard(key);

    const oldestEntry = await redis.zrange(key, 0, 0, { withScores: true });
    const reset =
      oldestEntry.length > 0
        ? parseInt(oldestEntry[1] as string) + windowMs
        : now + windowMs;

    return {
      success: count < max,
      limit: max,
      remaining: Math.max(0, max - count),
      reset,
    };
  } catch (error) {
    console.error('Redis status check error:', error);
    return {
      success: true,
      limit: max,
      remaining: max,
      reset: now + windowMs,
    };
  }
}

export { redis };
```

### Update `src/lib/api-security.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit-redis';

type Handler = (request: NextRequest) => Promise<Response> | Response;

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

const defaultRateLimitOptions: Required<RateLimitOptions> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyPrefix: 'api',
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return request.ip || 'unknown';
}

export function withRateLimit(options?: RateLimitOptions) {
  const config = { ...defaultRateLimitOptions, ...options };

  return function wrap(handler: Handler): Handler {
    return async function limited(request: NextRequest) {
      const ip = getClientIP(request);
      const route = request.nextUrl.pathname;
      const identifier = `${route}:${ip}`;

      // Check rate limit
      const result = await checkRateLimit(identifier, config);

      if (!result.success) {
        const response = NextResponse.json(
          {
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            limit: result.limit,
            remaining: result.remaining,
            reset: new Date(result.reset).toISOString(),
          },
          { status: 429 }
        );

        response.headers.set('X-RateLimit-Limit', String(result.limit));
        response.headers.set('X-RateLimit-Remaining', String(result.remaining));
        response.headers.set(
          'X-RateLimit-Reset',
          new Date(result.reset).toISOString()
        );
        response.headers.set(
          'Retry-After',
          String(Math.ceil((result.reset - Date.now()) / 1000))
        );

        return response;
      }

      // Execute handler
      const response = await handler(request);

      // Add rate limit headers to successful response
      try {
        if (response instanceof NextResponse) {
          response.headers.set('X-RateLimit-Limit', String(result.limit));
          response.headers.set(
            'X-RateLimit-Remaining',
            String(result.remaining)
          );
          response.headers.set(
            'X-RateLimit-Reset',
            new Date(result.reset).toISOString()
          );
        }
      } catch (error) {
        // Ignore header setting errors
      }

      return response;
    };
  };
}

// ... rest of existing withCSRFProtection implementation
```

### Update `src/middleware/rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit-redis';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return request.ip || 'unknown';
}

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests from this IP',
    statusCode = 429,
    headers = true,
  } = config;

  return async function rateLimitMiddleware(request: NextRequest) {
    const ip = getClientIP(request);
    const identifier = ip;

    const result = await checkRateLimit(identifier, {
      windowMs,
      max,
      keyPrefix: 'middleware',
    });

    if (!result.success) {
      const response = NextResponse.json(
        { error: message, code: 'RATE_LIMIT_EXCEEDED' },
        { status: statusCode }
      );

      if (headers) {
        response.headers.set('X-RateLimit-Limit', String(result.limit));
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set(
          'X-RateLimit-Reset',
          new Date(result.reset).toISOString()
        );
        response.headers.set(
          'Retry-After',
          String(Math.ceil((result.reset - Date.now()) / 1000))
        );
      }

      return response;
    }

    const response = NextResponse.next();

    if (headers) {
      response.headers.set('X-RateLimit-Limit', String(result.limit));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set(
        'X-RateLimit-Reset',
        new Date(result.reset).toISOString()
      );
    }

    return response;
  };
}

// Predefined configurations
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts. Please try again later.',
  },
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many API requests. Please try again later.',
  },
  public: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests. Please try again later.',
  },
};

export function applyRateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth') || pathname.includes('login')) {
    return createRateLimit(rateLimitConfigs.auth)(request);
  }

  if (
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/metrics')
  ) {
    return createRateLimit(rateLimitConfigs.public)(request);
  }

  if (pathname.startsWith('/api/')) {
    return createRateLimit(rateLimitConfigs.api)(request);
  }

  return NextResponse.next();
}
```

## Step 7: Update `.env.example`

```bash
# Add to .env.example
# Upstash Redis (for distributed rate limiting)
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## Step 8: Test Rate Limiting

### Test Script (`scripts/test-rate-limit.js`)

```javascript
const fetch = require('node-fetch');

async function testRateLimit() {
  const endpoint = 'http://localhost:3000/api/health';
  let successCount = 0;
  let rateLimitedCount = 0;

  console.log('Testing rate limit...');
  console.log('Sending 100 requests to', endpoint);

  for (let i = 0; i < 100; i++) {
    const response = await fetch(endpoint);
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (response.status === 429) {
      rateLimitedCount++;
      console.log(`Request ${i + 1}: Rate Limited (${response.status})`);
      console.log(`  Remaining: ${remaining}, Reset: ${reset}`);
    } else {
      successCount++;
      if (i % 20 === 0) {
        console.log(`Request ${i + 1}: Success (${response.status})`);
        console.log(`  Limit: ${limit}, Remaining: ${remaining}`);
      }
    }
  }

  console.log('\\n=== Test Results ===');
  console.log(`Successful: ${successCount}`);
  console.log(`Rate Limited: ${rateLimitedCount}`);
  console.log(`Rate limit working: ${rateLimitedCount > 0 ? '✅' : '❌'}`);
}

testRateLimit().catch(console.error);
```

Run test:

```bash
npm run dev
node scripts/test-rate-limit.js
```

## Step 9: Monitor Redis Usage

### Upstash Dashboard

1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your database
3. View:
   - **Commands per second**
   - **Data size**
   - **Monthly usage**

### Redis CLI (optional)

```bash
# Install Redis CLI
npm install -g upstash-redis-cli

# Connect
upstash-redis-cli --url https://your-db.upstash.io --token your_token

# Check keys
KEYS ratelimit:*

# Check specific key
ZRANGE ratelimit:/api/health:127.0.0.1 0 -1 WITHSCORES

# Delete all rate limit keys (testing only)
DEL $(KEYS ratelimit:*)
```

## Cost Estimate

### Free Tier (Sufficient for MVP)

- **10,000 commands/day**
- **256 MB storage**
- **Max 100 concurrent connections**
- **Perfect for:** Testing, small apps, rate limiting

### Pay-as-you-go

- **$0.2 per 100K commands** after free tier
- **$0.25 per GB storage** (unlikely to hit for rate limiting)

### Expected Cost for GuruKool

- **Estimated traffic:** 100K requests/month
- **Rate limit checks:** 100K/month
- **Storage:** <1 MB (rate limit keys with TTL)
- **Monthly cost:** **$0-2**

## Troubleshooting

### Issue: Rate limit not working

**Check:**

1. Environment variables set correctly
2. Redis connection successful
3. `@upstash/redis` installed
4. Middleware applied to route

### Issue: All requests rate limited

**Cause:** Shared IP (localhost)
**Solution:** Test with different IPs or user-based rate limiting

### Issue: Redis connection timeout

**Check:**

1. Upstash database is active
2. TLS enabled (default for Upstash)
3. Correct REST URL and token
4. No firewall blocking Upstash

### Issue: High latency

**Solution:**

- Choose Upstash region closest to Vercel region
- Enable Edge caching if needed
- Use global database for worldwide apps

## Migration from In-Memory

### Before (In-Memory)

```typescript
const store = new Map(); // Lost on restart
```

### After (Redis)

```typescript
const redis = new Redis({...}); // Persistent across restarts
```

### Benefits

✅ Works across multiple Vercel serverless instances
✅ Survives cold starts
✅ Shared state across regions
✅ Persistent IP bans
✅ Accurate rate limiting
✅ ~10ms latency (Upstash Edge)

## Next Steps

1. ✅ Create Upstash account
2. ✅ Create Redis database
3. ✅ Add environment variables
4. ✅ Install `@upstash/redis`
5. ✅ Implement rate limiting with Redis
6. ✅ Test locally
7. ✅ Deploy to Vercel
8. ✅ Monitor usage in Upstash dashboard

## Production Checklist

- [ ] Upstash Redis database created
- [ ] Environment variables set in Vercel
- [ ] `@upstash/redis` installed
- [ ] Rate limit implementation updated
- [ ] Local testing passed
- [ ] Staging deployment tested
- [ ] Production deployment verified
- [ ] Monitoring dashboard configured
- [ ] Alert thresholds set (if needed)

---

**Estimated Setup Time:** 30-60 minutes
**Difficulty:** Easy
**Cost:** $0-2/month (likely free tier)
**Impact:** HIGH (fixes production blocker)
