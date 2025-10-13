# Backend Gap Analysis - GuruKool HomeSchool

**Analysis Date:** 2025-10-13
**Target Environment:** Vercel + Supabase (Production)
**Current Status:** MVP with functional features, requires hardening for production

---

## Executive Summary

The GuruKool HomeSchool backend has a solid foundation with Next.js 14 App Router, Supabase integration, and middleware security. However, several **critical gaps** must be addressed before production deployment:

### 🔴 Critical Gaps (P0 - Block Production)

- No comprehensive Row Level Security (RLS) policies implemented
- Missing server/client separation for Supabase service key
- Mock data in metrics endpoint (`/api/metrics`)
- No error boundaries (`error.tsx`, `not-found.tsx`)
- TypeScript and ESLint errors ignored in build (`next.config.mjs`)
- No Input validation with Zod on API routes
- In-memory rate limiting (not production-ready)

### 🟡 High Priority Gaps (P1 - Launch Blockers)

- No observability/logging infrastructure (Sentry, structured logging)
- Missing health check connectivity verification
- No CI/CD pipeline with quality gates
- Incomplete migration strategy
- Missing backup/disaster recovery procedures

### 🟢 Medium Priority Gaps (P2 - Post-Launch Improvements)

- Performance optimization opportunities
- Cost optimization not implemented
- Missing API documentation
- Limited test coverage on critical paths

---

## 1. Database & Data Layer

### ✅ **What's Working**

- Supabase client configuration with singleton pattern
- Database service layer for CRUD operations (students, teachers)
- Migration files exist in `supabase/migrations/`
- Basic RLS enabled on tables
- Proper indexing on key columns
- Teacher-student QR code system integrated with database
- Trigger functions for `updated_at` timestamps

### 🔴 **Critical Gaps**

#### 1.1 Row Level Security (RLS) Policies - INCOMPLETE

**Issue:** RLS policies exist but are **insufficient** for production multi-tenancy.

**Current State:**

```sql
-- From 001_initial_schema.sql
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Teachers can read assigned sessions" ON sessions
    FOR SELECT USING (
        auth.uid()::text = teacher_id::text OR
        auth.uid()::text = parent_id::text
    );
```

**Gaps:**

- ❌ Missing INSERT policies for students/teachers tables
- ❌ No admin override policies
- ❌ `auth_sessions` table has RLS enabled but **no policies defined**
- ❌ No policies for `teacher_qr_codes` CREATE operations by service
- ❌ Policies use string casting (`::text`) instead of UUID comparison
- ❌ No cascade policies for related data (e.g., deleting student should check parent ownership)

**Required Actions:**

```sql
-- Missing policies for students table
CREATE POLICY "Parents can create students" ON students
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their students" ON students
    FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their students" ON students
    FOR DELETE USING (auth.uid() = parent_id);

-- Missing policies for teachers table
CREATE POLICY "Service can create teachers" ON teachers
    FOR INSERT WITH CHECK (true); -- Service role only

-- Add admin policies across all tables
CREATE POLICY "Admins have full access" ON students
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Fix auth_sessions (currently has no policies despite RLS enabled)
CREATE POLICY "Users can read own auth_sessions" ON auth_sessions
    FOR SELECT USING (user_id = auth.uid());
```

**Priority:** 🔴 **P0 - Critical**
**Effort:** Medium (2-3 days to audit, write, and test all policies)

---

#### 1.2 Service Key Exposure Risk

**Issue:** `supabase.ts` now correctly uses `getSupabaseAdmin()` with server-side guard, but **database.service.ts still uses direct client**.

**Current Risk in `database.service.ts`:**

```typescript
// Line 5-8 in database.service.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// This is ANON key (correct), but createTeacher() calls auth.signUp
// which requires service key for server-side user creation
```

**Gaps:**

- ❌ `createTeacher()` method creates auth users but uses anon key (line 209-222)
- ❌ Should use `getSupabaseAdmin()` for user creation operations
- ❌ Mixed client usage creates confusion about which operations need service key

**Required Actions:**

1. Update `database.service.ts` to use `getSupabaseAdmin()` for admin operations:

```typescript
import { getSupabaseAdmin } from '@/lib/supabase';

static async createTeacher(teacherData: any, parentId: string): Promise<TeacherProfile | null> {
  try {
    const admin = getSupabaseAdmin(); // Server-only
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email: teacherData.email,
      password: this.generatePassword(),
      user_metadata: {
        name: teacherData.name,
        role: 'teacher',
      },
    });
    // ...rest
  }
}
```

2. Document which operations require service key vs. anon key
3. Add `server-only` package import at top of file

**Priority:** 🔴 **P0 - Critical Security Issue**
**Effort:** Low (1 day)

---

#### 1.3 Migration Discipline & Versioning

**Issue:** Migration files exist but **no enforcement of migration-only schema changes**.

**Current State:**

- ✅ 5 migration files exist
- ❌ No Supabase CLI setup documented
- ❌ No staging environment migration testing
- ❌ Migrations may have been partially applied manually (numbering: 003 appears twice)

**Gaps:**

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_data_sheets_and_extended_features.sql
├── 003_timesheet_schema.sql  ⚠️
├── 003_teachers_table.sql     ⚠️ DUPLICATE PREFIX
└── 004_teacher_qr_codes.sql
```

**Required Actions:**

1. Rename `003_teachers_table.sql` to `005_teachers_table.sql`
2. Create `supabase/config.toml` for project configuration
3. Document migration workflow in `docs/migrations.md`:
   - Local: `supabase db reset` → `supabase db push`
   - Staging: `supabase db push --db-url <staging>`
   - Production: `supabase db push --db-url <production>` (with backup first)
4. Add migration checks to CI pipeline
5. Enforce "no console edits" policy

**Priority:** 🟡 **P1 - High**
**Effort:** Low (1-2 days)

---

#### 1.4 Backup & Disaster Recovery

**Issue:** No documented backup strategy or RPO/RTO.

**Gaps:**

- ❌ Supabase PITR (Point-In-Time Recovery) not confirmed enabled
- ❌ No backup verification process
- ❌ No disaster recovery runbook
- ❌ No restore testing schedule

**Required Actions:**

1. Enable Supabase PITR (requires Pro plan: $25/month)
2. Document RPO (Recovery Point Objective): target 5 minutes
3. Document RTO (Recovery Time Objective): target 1 hour
4. Create `docs/disaster-recovery.md` with:
   - Backup verification process
   - Restore procedures
   - Contact escalation tree
5. Schedule quarterly restore drills in staging

**Priority:** 🟡 **P1 - High**
**Effort:** Medium (2-3 days for setup + documentation)

---

## 2. API Routes & Endpoints

### ✅ **What's Working**

- 5 API routes implemented (`health`, `metrics`, `test`, `contact-admin`, `credentials`)
- Rate limiting wrapper (`withRateLimit`) functional
- Health endpoint checks Supabase connectivity
- Proper error handling in most routes

### 🔴 **Critical Gaps**

#### 2.1 Mock Data in Metrics Endpoint

**Issue:** `/api/metrics` returns **fake data** using `Math.random()`.

**Current Code:**

```typescript
// src/app/api/metrics/route.ts lines 26-37
http_requests_total{method="GET",status="200"} ${Math.floor(Math.random() * 1000)}
http_requests_total{method="POST",status="200"} ${Math.floor(Math.random() * 500)}
// ...more fake metrics
```

**Impact:**

- Misleading Prometheus/monitoring data
- Cannot track real request patterns
- Violates "no mock data" project rule

**Required Actions:**

1. Implement real metrics collection:

```typescript
// Use global counter or Redis
import { metricsCollector } from '@/lib/metrics';

export const GET = withRateLimit({ keyPrefix: 'api:metrics', max: 60 })(
  async function GET(request: NextRequest) {
    const metrics = metricsCollector.getPrometheusMetrics();
    return new NextResponse(metrics, {
      headers: { 'Content-Type': 'text/plain; version=0.0.4' },
    });
  }
);
```

2. Options for metrics storage:
   - **Option A:** Vercel Analytics API (native integration)
   - **Option B:** Redis for counters (e.g., Upstash)
   - **Option C:** Edge config for lightweight metrics
   - **Recommended:** Vercel Analytics + custom events

**Priority:** 🔴 **P0 - Blocks Production Monitoring**
**Effort:** Medium (2-3 days)

---

#### 2.2 No Input Validation with Zod

**Issue:** API routes accept user input without schema validation.

**Current Risk:**

```typescript
// src/app/api/contact-admin/route.ts line 6-7
const body = await request.json();
const { name, email, phone, organization, message, requestType } = body;
// Direct destructuring, no validation of types or constraints
```

**Gaps:**

- ❌ No Zod schemas defined for request bodies
- ❌ No validation for required fields beyond null checks
- ❌ No sanitization of user input
- ❌ Email validation is regex-based, not standardized

**Required Actions:**

1. Create `src/lib/validators/api-schemas.ts`:

```typescript
import { z } from 'zod';

export const contactAdminSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  message: z.string().min(10).max(5000),
  requestType: z.enum(['demo', 'support', 'sales', 'other']).optional(),
});

export const credentialsSchema = z.object({
  email: z.string().email(),
});
```

2. Update all API routes to use validation:

```typescript
import { contactAdminSchema } from '@/lib/validators/api-schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactAdminSchema.parse(body); // Throws on invalid
    // ...use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**Priority:** 🔴 **P0 - Security & Data Integrity**
**Effort:** Medium (2-3 days to add validation to all endpoints)

---

#### 2.3 Demo Credentials Endpoint - Security Risk

**Issue:** `/api/credentials` exposes hardcoded passwords in plain text.

**Current Code:**

```typescript
// src/app/api/credentials/route.ts lines 3-7
const demoCredentials = {
  'parent@example.com': { password: 'parent123', role: 'parent' },
  'admin@example.com': { password: 'admin123', role: 'admin' },
  'teacher@example.com': { password: 'teacher123', role: 'teacher' },
};
```

**Impact:**

- Hardcoded passwords violate security best practices
- GET endpoint lists all demo emails (line 40-42)
- Passwords returned in plain text (line 26)

**Required Actions:**

1. **For production:** Delete this endpoint entirely
2. **For staging/demo:**
   - Move credentials to environment variables
   - Hash passwords even for demo accounts
   - Add authentication to endpoint (admin-only access)
   - Add rate limiting (already has it in `contact-admin` but not here)

3. Add deprecation warning:

```typescript
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint disabled in production' },
      { status: 404 }
    );
  }
  // ...rest
}
```

**Priority:** 🔴 **P0 - Critical Security Issue**
**Effort:** Low (1 day)

---

#### 2.4 Missing API Routes

**Issue:** Several expected API routes not implemented.

**Gaps:**

- ❌ No `/api/auth/*` routes (login, logout, refresh, qr-verify)
- ❌ No `/api/students/*` CRUD routes
- ❌ No `/api/teachers/*` CRUD routes
- ❌ No `/api/sessions/*` CRUD routes
- ❌ No `/api/analytics/*` endpoints
- ❌ No `/api/qr/generate` or `/api/qr/verify` routes

**Current State:**

- Database service layer exists but no API layer
- All operations happen client-side (insecure for service key operations)

**Required Actions:**

1. Create API routes for core entities:

```typescript
// src/app/api/students/route.ts
import { getSupabaseAdmin } from '@/lib/supabase';
import { DatabaseService } from '@/services/database.service';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const students = await DatabaseService.getStudents(session.user.id);
  return NextResponse.json(students);
}

export async function POST(request: NextRequest) {
  // ... create student with validation
}
```

2. Add authentication middleware for all protected routes
3. Move server-side operations from client components to API routes

**Priority:** 🟡 **P1 - High (Required for secure operations)**
**Effort:** High (1-2 weeks for full CRUD API)

---

## 3. Middleware & Security

### ✅ **What's Working**

- CSRF protection middleware implemented
- Rate limiting middleware with in-memory store
- Security headers in `next.config.mjs`
- Conditional CSP for dev vs. production
- Client IP extraction from headers

### 🔴 **Critical Gaps**

#### 3.1 In-Memory Rate Limiting (Not Production-Ready)

**Issue:** Rate limiting uses `Map<string, {...}>` in memory.

**Current Code:**

```typescript
// src/middleware/rate-limit.ts line 4
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// src/lib/api-security.ts line 24-27
const routeRateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();
```

**Problems:**

- ❌ Does not work across multiple Vercel serverless instances
- ❌ Data loss on function cold starts
- ❌ No shared state between regions
- ❌ No persistence means no IP ban tracking

**Required Actions:**

1. **Replace with Redis (Upstash):**

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function createRateLimit(config: RateLimitConfig) {
  return async function (request: NextRequest) {
    const ip = getClientIP(request);
    const key = `ratelimit:${ip}:${Date.now() / windowMs}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    if (count > max) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.next();
  };
}
```

2. **Alternative (if avoiding Redis):** Vercel Edge Config
   - Lighter weight but less flexible
   - Good for IP blacklists, not granular rate limits

**Priority:** 🔴 **P0 - Blocks Multi-Instance Deployment**
**Effort:** Medium (2-3 days including Upstash setup)

---

#### 3.2 CSP Report-URI Missing

**Issue:** CSP header configured but no violation reporting.

**Current Code:**

```typescript
// next.config.mjs lines 56-69
const cspDirectives = [
  "default-src 'self'",
  ...scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  // ... no report-uri directive
].join('; ');
```

**Gap:**

- ❌ Cannot track CSP violations in production
- ❌ No visibility into potential XSS attempts

**Required Actions:**

1. Add Sentry CSP reporting:

```typescript
const cspDirectives = [
  // ...existing directives
  `report-uri https://o<org-id>.ingest.sentry.io/api/<project-id>/security/?sentry_key=<key>`,
  `report-to csp-endpoint`,
].join('; ');
```

2. Alternative: Custom endpoint `/api/csp-report` if avoiding Sentry

**Priority:** 🟡 **P1 - High (Security Visibility)**
**Effort:** Low (1 day)

---

#### 3.3 No Authentication Middleware

**Issue:** No centralized auth middleware for protected routes.

**Current State:**

- Individual routes check auth manually
- No consistent session validation
- No role-based access control (RBAC) enforcement

**Required Actions:**

1. Create `src/middleware/auth.ts`:

```typescript
import { getSession } from '@/lib/session';

export function requireAuth(allowedRoles?: string[]) {
  return async function (request: NextRequest) {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Attach session to request for downstream use
    (request as any).session = session;
    return NextResponse.next();
  };
}
```

2. Update `middleware.ts` to include auth checks:

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith('/parent') || pathname.startsWith('/api/students')) {
    return requireAuth(['parent', 'admin'])(request);
  }

  // ... rest of middleware
}
```

**Priority:** 🔴 **P0 - Critical Security Gap**
**Effort:** Medium (2-3 days)

---

## 4. Error Handling & Observability

### ✅ **What's Working**

- Logging service exists (`logging.service.ts`)
- Basic console logging in place
- API routes return error responses

### 🔴 **Critical Gaps**

#### 4.1 Missing Error Boundaries

**Issue:** No `error.tsx` or `not-found.tsx` in app directory.

**Current State:**

```
src/app/
├── page.tsx
├── layout.tsx
├── parent/
│   ├── layout.tsx
│   └── dashboard/page.tsx
├── teacher/...
└── admin/...

❌ No error.tsx
❌ No not-found.tsx
❌ No global-error.tsx
```

**Impact:**

- Unhandled errors show default Next.js error page
- No custom error tracking
- Poor UX for 404s

**Required Actions:**

1. Create `src/app/error.tsx`:

```typescript
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
```

2. Create `src/app/not-found.tsx` (for 404s)
3. Create `src/app/global-error.tsx` (for uncaught errors in root layout)

**Priority:** 🔴 **P0 - Critical UX Gap**
**Effort:** Low (1 day)

---

#### 4.2 No Observability Stack

**Issue:** No error tracking, APM, or structured logging configured.

**Gaps:**

- ❌ No Sentry integration
- ❌ No structured logging (pino, winston)
- ❌ No request tracing/correlation IDs
- ❌ No performance monitoring
- ❌ No real-time alerting

**Required Actions:**

1. **Add Sentry:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

2. Configure in `sentry.client.config.ts` and `sentry.server.config.ts`

3. **Add Structured Logging:**

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: label => ({ level: label }),
  },
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'email',
    'password',
  ],
});
```

4. **Add Request IDs:**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set('X-Request-ID', requestId);
  return response;
}
```

**Priority:** 🟡 **P1 - High (Cannot operate blind in production)**
**Effort:** Medium (2-3 days for full setup)

---

## 5. Build & Deployment

### ✅ **What's Working**

- Next.js build configured
- Environment variable structure defined
- Vercel deployment ready (based on package.json script)

### 🔴 **Critical Gaps**

#### 5.1 TypeScript & ESLint Errors Ignored

**Issue:** Build configured to ignore errors.

**Current Code:**

```typescript
// next.config.mjs lines 25-31
eslint: {
  ignoreDuringBuilds: true,
  dirs: ['src'],
},
typescript: {
  ignoreBuildErrors: true,
},
```

**Impact:**

- Type safety compromised
- Unknown number of actual errors
- Technical debt accumulation

**Required Actions:**

1. **Immediate:** Run `npm run type-check` to surface errors
2. **Fix blocking errors:**
   ```bash
   npm run type-check 2>&1 | tee type-errors.log
   # Address errors one by one
   ```
3. **Remove ignore flags from `next.config.mjs`**
4. **Add to CI pipeline:**
   ```yaml
   # .github/workflows/ci.yml
   - name: Type check
     run: npm run type-check
   - name: Lint
     run: npm run lint
   ```

**Priority:** 🔴 **P0 - Code Quality Blocker**
**Effort:** High (1-2 weeks depending on error count)

---

#### 5.2 No CI/CD Pipeline

**Issue:** No GitHub Actions or CI configuration.

**Gaps:**

- ❌ No automated testing before merge
- ❌ No build verification
- ❌ No quality gates
- ❌ No preview environment checks

**Required Actions:**

1. Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm test

      - name: Build
        run: npm run build

      - name: E2E tests
        run: npm run test:e2e
```

2. Configure Vercel to require CI checks before deploying

**Priority:** 🟡 **P1 - High (Quality Gate)**
**Effort:** Medium (2-3 days for full pipeline)

---

## 6. Performance & Cost

### ✅ **What's Working**

- Next.js 14 with App Router (server components by default)
- Conditional CSP reduces overhead in production

### 🟡 **High Priority Gaps**

#### 6.1 No Rendering Strategy Defined

**Issue:** All pages default to SSR; no static/ISR configured.

**Current Cost Impact:**

- Every page request triggers server render
- Higher Vercel function invocations
- Slower TTFB for static content

**Required Actions:**

1. **Audit pages and mark static:**

```typescript
// src/app/page.tsx (homepage)
export const dynamic = 'force-static';
export const revalidate = 3600; // ISR: revalidate hourly

// src/app/parent/dashboard/page.tsx (personalized)
export const dynamic = 'force-dynamic'; // SSR required
```

2. **Add data caching:**

```typescript
// In API routes or server components
const students = await fetch('...', {
  next: { revalidate: 60 }, // Cache for 60 seconds
});
```

**Priority:** 🟡 **P1 - Cost & Performance**
**Effort:** Medium (2-3 days to audit and optimize)

---

#### 6.2 No Bundle Analysis

**Issue:** Unknown bundle size or code splitting issues.

**Required Actions:**

1. Add bundle analyzer:

```bash
npm install @next/bundle-analyzer
```

2. Update `next.config.mjs`:

```typescript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

3. Run: `ANALYZE=true npm run build`

**Priority:** 🟢 **P2 - Post-Launch Optimization**
**Effort:** Low (1 day)

---

## 7. Testing & Quality

### ✅ **What's Working**

- Jest configured
- Playwright E2E tests exist
- Test scripts in `package.json`

### 🟡 **High Priority Gaps**

#### 7.1 Low Test Coverage

**Issue:** Minimal test files found.

**Current Coverage:**

```
src/agents/__tests__/          ✅ 4 test files
src/components/__tests__/      ✅ 2 test files
src/services/__tests__/        ✅ 1 test file
src/design-system/__tests__/   ✅ Multiple test files

API routes:                     ❌ 0 test files
Database service:               ❌ No tests
Middleware:                     ❌ No tests
```

**Required Actions:**

1. Add API route tests:

```typescript
// src/app/api/health/__tests__/route.test.ts
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('/api/health', () => {
  it('returns 200 when Supabase is connected', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

2. Target: 80% coverage on services and API routes

**Priority:** 🟡 **P1 - Quality Gate**
**Effort:** High (1-2 weeks)

---

## 8. Documentation & Operations

### 🟡 **High Priority Gaps**

#### 8.1 Missing Operational Runbooks

**Issue:** No documented procedures for incidents, rollbacks, or on-call.

**Required Actions:**

1. Create `docs/` directory with:
   - `incident-response.md` - Escalation tree, common issues
   - `rollback-procedure.md` - How to rollback deployments
   - `database-recovery.md` - Backup restore procedures
   - `monitoring-alerts.md` - Alert definitions and responses

**Priority:** 🟡 **P1 - Operational Readiness**
**Effort:** Medium (2-3 days)

---

#### 8.2 No API Documentation

**Issue:** No OpenAPI/Swagger docs for API endpoints.

**Required Actions:**

1. Generate OpenAPI spec from Zod schemas (once implemented)
2. Use `swagger-ui-react` or Scalar for docs UI
3. Host at `/api/docs`

**Priority:** 🟢 **P2 - Developer Experience**
**Effort:** Medium (3-5 days)

---

## Priority Matrix & Implementation Roadmap

### Phase 1: Pre-Production Hardening (2-3 weeks)

**Goal:** Address all P0 (Critical) gaps

| Gap ID | Task                                              | Priority | Effort | Owner    |
| ------ | ------------------------------------------------- | -------- | ------ | -------- |
| 1.1    | Complete RLS policies                             | 🔴 P0    | Medium | Backend  |
| 1.2    | Fix service key usage in database.service.ts      | 🔴 P0    | Low    | Backend  |
| 2.1    | Replace mock metrics with real data               | 🔴 P0    | Medium | Backend  |
| 2.2    | Add Zod validation to all API routes              | 🔴 P0    | Medium | Backend  |
| 2.3    | Remove/secure demo credentials endpoint           | 🔴 P0    | Low    | Backend  |
| 3.1    | Replace in-memory rate limiting with Redis        | 🔴 P0    | Medium | Backend  |
| 3.3    | Implement authentication middleware               | 🔴 P0    | Medium | Backend  |
| 4.1    | Create error.tsx and not-found.tsx                | 🔴 P0    | Low    | Frontend |
| 5.1    | Fix TypeScript/ESLint errors, remove ignore flags | 🔴 P0    | High   | Team     |

**Total Effort:** ~4 weeks (parallel work possible)

---

### Phase 2: Production Launch (2-3 weeks)

**Goal:** Address all P1 (High Priority) gaps

| Gap ID | Task                                                        | Priority | Effort | Owner   |
| ------ | ----------------------------------------------------------- | -------- | ------ | ------- |
| 1.3    | Enforce migration discipline                                | 🟡 P1    | Low    | Backend |
| 1.4    | Setup backups & DR procedures                               | 🟡 P1    | Medium | DevOps  |
| 2.4    | Implement missing API routes (students, teachers, sessions) | 🟡 P1    | High   | Backend |
| 3.2    | Add CSP reporting                                           | 🟡 P1    | Low    | Backend |
| 4.2    | Setup Sentry + structured logging                           | 🟡 P1    | Medium | DevOps  |
| 5.2    | Create CI/CD pipeline                                       | 🟡 P1    | Medium | DevOps  |
| 6.1    | Optimize rendering strategy                                 | 🟡 P1    | Medium | Team    |
| 7.1    | Increase test coverage to 80%                               | 🟡 P1    | High   | Team    |
| 8.1    | Write operational runbooks                                  | 🟡 P1    | Medium | Team    |

**Total Effort:** ~6 weeks (parallel work possible)

---

### Phase 3: Post-Launch Optimization (Ongoing)

**Goal:** Address all P2 (Medium Priority) gaps

| Gap ID | Task                             | Priority | Effort | Owner    |
| ------ | -------------------------------- | -------- | ------ | -------- |
| 6.2    | Bundle analysis and optimization | 🟢 P2    | Low    | Frontend |
| 8.2    | API documentation                | 🟢 P2    | Medium | Backend  |

---

## Acceptance Criteria for Production

### Before Production Launch, ALL of the following must be ✅:

#### Security

- [ ] All RLS policies implemented and tested
- [ ] Service key usage properly separated from client code
- [ ] All API routes have Zod validation
- [ ] Authentication middleware enforces RBAC
- [ ] Rate limiting uses Redis (or equivalent distributed store)
- [ ] CSP violations reported to Sentry
- [ ] Demo credentials endpoint removed or secured

#### Observability

- [ ] Sentry configured for error tracking
- [ ] Structured logging with request IDs implemented
- [ ] Health check verifies Supabase connectivity
- [ ] Real metrics endpoint (no mock data)
- [ ] Error boundaries implemented (error.tsx, not-found.tsx)

#### Data & Reliability

- [ ] Supabase PITR enabled and verified
- [ ] Migration discipline enforced (no console edits)
- [ ] Backup/restore tested in staging
- [ ] RPO/RTO documented

#### Code Quality

- [ ] `tsc --noEmit` passes with 0 errors
- [ ] `npm run lint` passes with acceptable warnings
- [ ] `ignoreBuildErrors` and `ignoreDuringBuilds` removed from next.config.mjs
- [ ] Test coverage ≥ 80% on services and API routes

#### CI/CD

- [ ] GitHub Actions pipeline runs on all PRs
- [ ] Quality gates block merging (type-check, lint, tests)
- [ ] Preview deployments linked to staging Supabase
- [ ] Production deployment requires manual approval

#### Operations

- [ ] Incident response runbook documented
- [ ] Rollback procedure documented and tested
- [ ] On-call rotation established
- [ ] Monitoring dashboards configured

---

## Cost Estimates

### Additional Services Required for Production

| Service           | Purpose         | Tier           | Monthly Cost     |
| ----------------- | --------------- | -------------- | ---------------- |
| **Supabase**      | Database + Auth | Pro            | $25              |
| **Upstash Redis** | Rate limiting   | Free/Pay-as-go | $0-20            |
| **Sentry**        | Error tracking  | Team           | $26              |
| **Vercel**        | Hosting         | Pro            | $20              |
| **Total**         |                 |                | **$71-91/month** |

### Development Time Investment

| Phase               | Duration      | FTE        | Total Effort   |
| ------------------- | ------------- | ---------- | -------------- |
| Phase 1 (P0)        | 2-3 weeks     | 2 devs     | 4-6 weeks      |
| Phase 2 (P1)        | 2-3 weeks     | 2 devs     | 4-6 weeks      |
| **Total to Launch** | **4-6 weeks** | **2 devs** | **8-12 weeks** |

---

## Recommendations

### Immediate Actions (This Week)

1. **Run type-check** to surface all TypeScript errors
2. **Audit Supabase RLS policies** - verify parent data isolation
3. **Setup Upstash Redis** account for rate limiting
4. **Remove demo credentials endpoint** or add `NODE_ENV` guard

### High-Impact Quick Wins

1. **Add Zod validation** to `/api/contact-admin` (template for other routes)
2. **Create error.tsx** for better error UX
3. **Fix service key usage** in database.service.ts
4. **Setup Sentry** - catches issues immediately

### Long-Term Architectural Improvements

1. **Move to API routes for all data operations** (eliminate client-side Supabase calls)
2. **Implement caching layer** (Redis or Vercel Edge Config)
3. **Add feature flags** for gradual rollout
4. **Setup staging environment** mirroring production

---

## Conclusion

The GuruKool HomeSchool backend has a **solid foundation** but requires **4-6 weeks of hardening** before production launch. The most critical gaps are:

1. **Security:** Incomplete RLS, service key exposure, no input validation
2. **Observability:** No error tracking, mock metrics, missing error boundaries
3. **Code Quality:** TypeScript errors ignored, no CI/CD
4. **Infrastructure:** In-memory rate limiting, no distributed state

**Recommendation:** Prioritize Phase 1 (P0 items) before any production launch. Phase 2 (P1 items) can be staged over 2-3 weeks post-launch with feature flags.

**Risk Assessment:** Current backend is **not production-ready** due to security gaps (RLS, service key, validation) and observability blind spots. Estimated **Medium-High risk** if deployed as-is.

**Next Steps:**

1. Review this gap analysis with team
2. Assign ownership for Phase 1 tasks
3. Create Jira/Linear tickets for each gap
4. Establish weekly check-ins to track progress
5. Schedule staging deployment for testing after Phase 1 completion

---

**Document Version:** 1.0
**Last Updated:** 2025-10-13
**Review Cycle:** Weekly during Phase 1, bi-weekly post-launch
