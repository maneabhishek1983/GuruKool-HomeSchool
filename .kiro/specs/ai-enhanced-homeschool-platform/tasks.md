# AI-Enhanced Homeschooling Platform - Implementation Tasks

**Last Updated:** 2025-10-13
**Production Readiness:** 45/100 (4-6 weeks to launch-ready)

---

## Executive Summary

This document tracks implementation tasks for the GuruKool HomeSchool platform based on current backend analysis. The platform has a solid foundation with Next.js 14, Supabase, and core features implemented, but requires **critical security and infrastructure hardening** before production deployment.

### Current Sprint Focus: Production Hardening Phase 1 (P0 Tasks)

**Goal:** Address all critical production blockers (2-3 weeks)
**Status:** 1 of 9 tasks complete (11%)

---

## Implementation Status Overview

### ✅ Completed (Since Project Start)

#### Core Infrastructure

- [x] Next.js 14 App Router setup with TypeScript
- [x] Supabase database integration
- [x] Database migrations system (`supabase/migrations/`)
- [x] Environment variable configuration
- [x] Tailwind CSS + Mantine UI integration
- [x] Path aliases configuration
- [x] Jest + Playwright testing setup
- [x] Storybook for component development

#### Authentication & Security

- [x] Supabase Auth integration
- [x] Role-based access control (parent/teacher/admin)
- [x] Teacher QR authentication system
- [x] Student-specific QR codes for teacher sessions
- [x] CSRF protection middleware
- [x] Rate limiting middleware (in-memory - **needs Redis upgrade**)
- [x] Security headers configuration
- [x] Demo credentials endpoint secured (production-disabled)

#### Database Schema & Services

- [x] Users table with role management
- [x] Students table with academic standards
- [x] Teachers table with qualifications
- [x] Sessions table with location tracking
- [x] Teacher QR codes table
- [x] Teacher sessions table
- [x] AI insights table
- [x] Learning analytics table
- [x] Data sheets system schema
- [x] Progress tracking schema
- [x] Conversations and messages tables
- [x] `DatabaseService` with CRUD operations
- [x] `QRAuthService` implementation
- [x] `TeacherQRService` implementation
- [x] Academic standards service (UK, US, India)

#### AI Agent System

- [x] `BaseAgent` abstract class
- [x] Agent orchestrator with priority execution
- [x] Agent registry system
- [x] Auth verification agent
- [x] Analytics agent
- [x] Task automation agent
- [x] Communication agent
- [x] Security analysis agent

#### User Interface

- [x] Landing page
- [x] Login page with demo accounts
- [x] Parent dashboard with 6 feature cards
- [x] Teacher dashboard with session management
- [x] Admin dashboard with system management
- [x] Responsive design (mobile/tablet/desktop)
- [x] Design system with tokens and themes
- [x] Logout functionality on all dashboards

#### API Routes

- [x] `/api/health` - Health check endpoint
- [x] `/api/metrics` - Metrics endpoint (**currently mock data**)
- [x] `/api/credentials` - Demo credentials (production-disabled)
- [x] `/api/contact-admin` - Contact form
- [x] `/api/test` - Test endpoint

---

## 🔴 Phase 1: Critical Production Blockers (P0) - 2-3 Weeks

**Status:** 1/9 complete (11%)
**Goal:** Fix all security and infrastructure gaps that block production deployment

### Task 1.1: Complete RLS Policies ⏳

**Priority:** 🔴 **P0 - CRITICAL**
**Status:** ⏳ **In Progress**
**Owner:** Backend
**Effort:** Medium (2-3 days)
**Blocker:** Authentication will fail in production

**Current State:**

- RLS enabled on 13 tables
- `auth_sessions` table has ZERO policies (critical)
- `sessions` table missing INSERT/DELETE policies
- 21 policies use inefficient `::text` casting

**Acceptance Criteria:**

- [ ] Add policies to `auth_sessions` (SELECT, UPDATE, INSERT, DELETE)
- [ ] Add INSERT and DELETE policies to `sessions` table
- [ ] Add INSERT policies to `ai_insights` and `learning_analytics`
- [ ] Add admin override policies to all tables
- [ ] Fix UUID string casting (`::text`) to native UUID comparison
- [ ] Write automated RLS tests
- [ ] Verify parent data isolation

**Implementation:**

```sql
-- Apply SQL from RLS_AUDIT_REPORT.md
-- Create migration: 006_fix_rls_policies.sql
-- Test in staging before production
```

**Related Documents:** [RLS_AUDIT_REPORT.md](../../../RLS_AUDIT_REPORT.md)

---

### Task 1.2: Replace In-Memory Rate Limiting with Redis ⏳

**Priority:** 🔴 **P0 - CRITICAL**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Medium (2-3 days)
**Blocker:** Rate limiting doesn't work across multiple serverless instances

**Current State:**

- Rate limiting uses `Map<string, {...}>` in memory
- Data loss on cold starts
- No shared state between Vercel instances

**Acceptance Criteria:**

- [ ] Create Upstash Redis account
- [ ] Setup Redis database (free tier sufficient)
- [ ] Install `@upstash/redis` package
- [ ] Implement Redis-based rate limiting in `src/lib/rate-limit-redis.ts`
- [ ] Update `src/lib/api-security.ts` to use Redis
- [ ] Update `src/middleware/rate-limit.ts` middleware
- [ ] Add environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
- [ ] Test locally with rate limit script
- [ ] Deploy to Vercel and verify in production

**Implementation:**

```bash
# Follow guide: UPSTASH_REDIS_SETUP.md
npm install @upstash/redis
# Add environment variables to Vercel
# Deploy and test
```

**Related Documents:** [UPSTASH_REDIS_SETUP.md](../../../UPSTASH_REDIS_SETUP.md)

---

### Task 1.3: Add Zod Validation to All API Routes ⏳

**Priority:** 🔴 **P0 - CRITICAL**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Medium (2-3 days)
**Blocker:** No input validation = data integrity and security risk

**Current State:**

- API routes accept user input without schema validation
- Direct destructuring from request body
- Implicit `any` types in handlers

**Acceptance Criteria:**

- [ ] Create `src/lib/validators/api-schemas.ts`
- [ ] Define Zod schemas for all API route request bodies
- [ ] Add validation to `/api/contact-admin`
- [ ] Add validation to `/api/credentials`
- [ ] Add validation to future API routes (students, teachers, sessions)
- [ ] Return typed error responses (400) on validation failure
- [ ] Remove all implicit `any` types

**Implementation:**

```typescript
// Create src/lib/validators/api-schemas.ts
import { z } from 'zod';

export const contactAdminSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  message: z.string().min(10).max(5000),
  requestType: z.enum(['demo', 'support', 'sales', 'other']).optional(),
});

export const studentSchema = z.object({
  name: z.string().min(1).max(200),
  dateOfBirth: z.string().datetime(),
  country: z.enum(['UK', 'US', 'India']),
  gradeLevel: z.string(),
  // ... more fields
});

export const teacherSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  qualifications: z.string(),
  specializations: z.array(z.string()),
  // ... more fields
});
```

**Related Documents:** [BACKEND_GAP_ANALYSIS.md](../../../BACKEND_GAP_ANALYSIS.md) (Section 2.2)

---

### Task 1.4: Create Error Boundaries ⏳

**Priority:** 🔴 **P0 - CRITICAL**
**Status:** ⏳ **Not Started**
**Owner:** Frontend
**Effort:** Low (1 day)
**Blocker:** Poor UX when errors occur

**Current State:**

- No `error.tsx` in app directory
- No `not-found.tsx` for 404 pages
- No `global-error.tsx` for uncaught errors

**Acceptance Criteria:**

- [ ] Create `src/app/error.tsx` with error tracking
- [ ] Create `src/app/not-found.tsx` for 404 pages
- [ ] Create `src/app/global-error.tsx` for root layout errors
- [ ] Add error boundaries to critical routes (parent, teacher, admin)
- [ ] Integrate with Sentry (when available)
- [ ] Test error recovery flows

**Implementation:**

```typescript
// src/app/error.tsx
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
    // Log to Sentry when available
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

**Related Documents:** [BACKEND_GAP_ANALYSIS.md](../../../BACKEND_GAP_ANALYSIS.md) (Section 4.1)

---

### Task 1.5: Fix Service Key Usage in database.service.ts ⏳

**Priority:** 🔴 **P0 - CRITICAL SECURITY**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Low (1 day)
**Blocker:** Service key potentially exposed to client

**Current State:**

- `database.service.ts` uses anon key for all operations
- `createTeacher()` calls `auth.signUp` which requires service key
- Mixed client usage creates security confusion

**Acceptance Criteria:**

- [ ] Update `database.service.ts` to import `getSupabaseAdmin()`
- [ ] Replace `createTeacher()` auth operations with admin client
- [ ] Add `server-only` package import
- [ ] Document which operations require service key vs anon key
- [ ] Ensure server-side only execution

**Implementation:**

```typescript
// At top of database.service.ts
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

// In createTeacher method
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
    // ... rest
  }
}
```

**Related Documents:** [BACKEND_GAP_ANALYSIS.md](../../../BACKEND_GAP_ANALYSIS.md) (Section 1.2)

---

### Task 1.6: Replace Mock Metrics with Real Data ⏳

**Priority:** 🔴 **P0 - CRITICAL**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Medium (2-3 days)
**Blocker:** Cannot monitor production without real metrics

**Current State:**

- `/api/metrics` returns fake data using `Math.random()`
- Misleading Prometheus/monitoring data
- Violates "no mock data" project rule

**Acceptance Criteria:**

- [ ] Implement real metrics collection library
- [ ] Track HTTP requests by method and status
- [ ] Track response times as histograms
- [ ] Track database connection pool metrics
- [ ] Use Redis for counter storage or Vercel Analytics
- [ ] Return Prometheus-compatible format
- [ ] Test with monitoring system (Grafana/Datadog)

**Implementation Options:**

- **Option A:** Vercel Analytics API (native integration)
- **Option B:** Redis counters with Upstash
- **Option C:** Edge config for lightweight metrics
- **Recommended:** Vercel Analytics + custom events

**Related Documents:** [BACKEND_GAP_ANALYSIS.md](../../../BACKEND_GAP_ANALYSIS.md) (Section 2.1)

---

### Task 1.7: Implement Authentication Middleware ⏳

**Priority:** 🔴 **P0 - CRITICAL SECURITY**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Medium (2-3 days)
**Blocker:** No centralized auth enforcement

**Current State:**

- Individual routes check auth manually
- No consistent session validation
- No RBAC enforcement

**Acceptance Criteria:**

- [ ] Create `src/middleware/auth.ts`
- [ ] Implement `requireAuth(allowedRoles?: string[])` function
- [ ] Update `middleware.ts` to protect routes
- [ ] Add session attachment to request object
- [ ] Test with all user roles (parent, teacher, admin)
- [ ] Verify 401 responses for unauth users
- [ ] Verify 403 responses for unauthorized roles

**Implementation:**

```typescript
// src/middleware/auth.ts
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

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

**Related Documents:** [BACKEND_GAP_ANALYSIS.md](../../../BACKEND_GAP_ANALYSIS.md) (Section 3.3)

---

### Task 1.8: Fix TypeScript Errors (Remove ignoreBuildErrors) ⏳

**Priority:** 🔴 **P0 - CRITICAL CODE QUALITY**
**Status:** ⏳ **In Progress** (errors identified)
**Owner:** Team
**Effort:** High (1-2 weeks)
**Blocker:** Type safety compromised, tech debt accumulation

**Current State:**

- 185 TypeScript errors surfaced
- `ignoreBuildErrors: true` in next.config.mjs
- `ignoreDuringBuilds: true` for ESLint
- Errors spread across tests, agents, components, API routes

**Error Breakdown:**

- Tests: ~80 errors (type mismatches in test mocks)
- Agent System: ~60 errors (`exactOptionalPropertyTypes` strictness)
- Components: ~30 errors (missing props, type mismatches)
- API Routes: ~5 errors (implicit any types)
- Services: ~10 errors (undefined checks)

**Acceptance Criteria:**

- [ ] Fix all API route TypeScript errors (highest priority)
- [ ] Add undefined guards to agent system
- [ ] Update test mocks to match strict types
- [ ] Fix component prop mismatches
- [ ] Remove `ignoreBuildErrors` from next.config.mjs
- [ ] Remove `eslint.ignoreDuringBuilds` from next.config.mjs
- [ ] Ensure `npm run type-check` passes with 0 errors
- [ ] Add type-check to CI pipeline

**Implementation:**

```bash
# 1. Fix blocking errors in phases
npm run type-check 2>&1 | tee type-errors.log

# 2. Focus areas (in priority order):
#    a. API routes (5 errors)
#    b. Database service (10 errors)
#    c. Agent system (60 errors)
#    d. Components (30 errors)
#    e. Tests (80 errors)

# 3. Remove ignore flags
# Edit next.config.mjs:
#   ignoreBuildErrors: false
#   ignoreDuringBuilds: false

# 4. Verify build passes
npm run build
```

**Related Documents:**

- [type-check-errors.log](../../../type-check-errors.log)
- [BACKEND_GAP_ANALYSIS.md](../../../BACKEND_GAP_ANALYSIS.md) (Section 5.1)
- [IMMEDIATE_ACTIONS_COMPLETE.md](../../../IMMEDIATE_ACTIONS_COMPLETE.md)

---

### Task 1.9: Demo Credentials Endpoint (Already Secured) ✅

**Priority:** 🔴 **P0 - CRITICAL SECURITY**
**Status:** ✅ **DONE**
**Owner:** Backend
**Effort:** Low (1 day)
**Completion Date:** 2025-10-13

**Completed Actions:**

- [x] Added production check to disable endpoint
- [x] Added environment variable support
- [x] Added type safety with `Record<string, ...>`
- [x] Added access logging with IP/timestamp
- [x] Added warning messages for dev-only usage
- [x] Returns 404 in production (not 403)
- [x] Staging override with `ENABLE_DEMO_CREDENTIALS=true`

**Related Documents:** [IMMEDIATE_ACTIONS_COMPLETE.md](../../../IMMEDIATE_ACTIONS_COMPLETE.md) (Section 4)

---

## 🟡 Phase 2: High Priority (P1) - 2-3 Weeks

**Status:** 0/12 complete (0%)
**Goal:** Make platform production-ready with observability and quality

### Task 2.1: Setup Sentry for Error Tracking ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** DevOps
**Effort:** Medium (2-3 days)

**Acceptance Criteria:**

- [ ] Create Sentry account (Team plan: $26/month)
- [ ] Run `npx @sentry/wizard@latest -i nextjs`
- [ ] Configure `sentry.client.config.ts`
- [ ] Configure `sentry.server.config.ts`
- [ ] Enable source maps for production
- [ ] Add user context to error reports
- [ ] Configure release tracking
- [ ] Test error capture (frontend and backend)
- [ ] Add CSP violation reporting to Sentry
- [ ] Configure performance monitoring

---

### Task 2.2: Implement Structured Logging with Pino ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Low (1-2 days)

**Acceptance Criteria:**

- [ ] Install `pino` package
- [ ] Create `src/lib/logger.ts`
- [ ] Configure log levels by environment
- [ ] Add PII redaction (email, password, tokens)
- [ ] Add request correlation IDs
- [ ] Replace all `console.log` with logger
- [ ] Add request/response logging on API routes
- [ ] Test log aggregation (if using service)

---

### Task 2.3: Create CI/CD Pipeline ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** DevOps
**Effort:** Medium (2-3 days)

**Acceptance Criteria:**

- [ ] Create `.github/workflows/ci.yml`
- [ ] Add type-check step
- [ ] Add lint step
- [ ] Add unit tests step
- [ ] Add build step
- [ ] Add E2E tests step
- [ ] Configure quality gates (block on failure)
- [ ] Link preview deployments to staging Supabase
- [ ] Require manual approval for production deployment

---

### Task 2.4: Implement Missing API Routes ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** High (1-2 weeks)

**Acceptance Criteria:**

- [ ] Create `/api/students` CRUD routes
- [ ] Create `/api/teachers` CRUD routes
- [ ] Create `/api/sessions` CRUD routes
- [ ] Create `/api/analytics` endpoints
- [ ] Create `/api/qr/generate` endpoint
- [ ] Create `/api/qr/verify` endpoint
- [ ] Add authentication middleware to all protected routes
- [ ] Add Zod validation to all routes
- [ ] Write API route tests
- [ ] Move client-side operations to API routes

---

### Task 2.5: Setup Supabase PITR Backups ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** DevOps
**Effort:** Medium (2-3 days)

**Acceptance Criteria:**

- [ ] Upgrade to Supabase Pro plan ($25/month)
- [ ] Enable Point-In-Time Recovery (PITR)
- [ ] Document RPO (Recovery Point Objective): 5 minutes
- [ ] Document RTO (Recovery Time Objective): 1 hour
- [ ] Create `docs/disaster-recovery.md` runbook
- [ ] Test backup restore in staging
- [ ] Schedule quarterly restore drills

---

### Task 2.6: Migration Discipline & Numbering Fix ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Low (1-2 days)

**Acceptance Criteria:**

- [ ] Rename `003_teachers_table.sql` to `005_teachers_table.sql`
- [ ] Create `supabase/config.toml`
- [ ] Document migration workflow in `docs/migrations.md`
- [ ] Test migrations in staging
- [ ] Add migration checks to CI pipeline
- [ ] Enforce "no console edits" policy

---

### Task 2.7: Optimize Rendering Strategy ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Team
**Effort:** Medium (2-3 days)

**Acceptance Criteria:**

- [ ] Audit all pages for rendering requirements
- [ ] Mark static pages with `export const dynamic = 'force-static'`
- [ ] Configure ISR with `revalidate` for semi-static pages
- [ ] Keep SSR only for personalized/auth-required pages
- [ ] Add data caching with `next: { revalidate }` option
- [ ] Move lightweight endpoints to Edge Runtime
- [ ] Measure TTFB, LCP, CLS improvements

---

### Task 2.8: Add CSP Violation Reporting ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Low (1 day)

**Acceptance Criteria:**

- [ ] Add Sentry CSP report-uri to next.config.mjs
- [ ] Test CSP violation detection
- [ ] Configure alerts for violations
- [ ] Monitor for potential XSS attempts

---

### Task 2.9: Increase Test Coverage to 80% ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Team
**Effort:** High (1-2 weeks)

**Current Coverage:**

- API routes: 0% (0 test files)
- Database service: 0% (no tests)
- Middleware: 0% (no tests)
- Agents: ~60% (4 test files)
- Components: ~40% (2 test files)
- Design system: ~70% (multiple test files)

**Acceptance Criteria:**

- [ ] Write API route tests for all endpoints
- [ ] Write database service tests
- [ ] Write middleware tests (CSRF, rate limiting, auth)
- [ ] Write RLS policy tests
- [ ] Expand E2E tests (auth flows, dashboards, QR flows)
- [ ] Achieve 80% coverage on services layer
- [ ] Achieve 80% coverage on API routes
- [ ] Add coverage reporting to CI

---

### Task 2.10: Create Operational Runbooks ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Team
**Effort:** Medium (2-3 days)

**Acceptance Criteria:**

- [ ] Create `docs/incident-response.md`
- [ ] Create `docs/rollback-procedure.md`
- [ ] Create `docs/database-recovery.md`
- [ ] Create `docs/monitoring-alerts.md`
- [ ] Document escalation tree
- [ ] Document common issues and resolutions
- [ ] Test rollback procedures in staging

---

### Task 2.11: Health Check Enhancement ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Low (1 day)

**Acceptance Criteria:**

- [ ] Add Redis connectivity check to `/api/health`
- [ ] Add response time measurement
- [ ] Return proper status codes (200/503)
- [ ] Add health check to monitoring system
- [ ] Configure alerts for failing health checks

---

### Task 2.12: Setup Staging Environment ⏳

**Priority:** 🟡 **P1 - HIGH**
**Status:** ⏳ **Not Started**
**Owner:** DevOps
**Effort:** Medium (2-3 days)

**Acceptance Criteria:**

- [ ] Create staging Supabase project
- [ ] Configure staging environment variables in Vercel
- [ ] Link preview deployments to staging
- [ ] Apply migrations to staging
- [ ] Seed staging data
- [ ] Test production-like scenarios in staging

---

## 🟢 Phase 3: Post-Launch Optimization (P2) - Ongoing

**Status:** 0/4 complete (0%)
**Goal:** Optimize performance, cost, and developer experience

### Task 3.1: Bundle Analysis & Optimization ⏳

**Priority:** 🟢 **P2 - MEDIUM**
**Status:** ⏳ **Not Started**
**Owner:** Frontend
**Effort:** Low (1 day)

**Acceptance Criteria:**

- [ ] Install `@next/bundle-analyzer`
- [ ] Run bundle analysis: `ANALYZE=true npm run build`
- [ ] Identify large bundles
- [ ] Implement code splitting on large routes
- [ ] Add dynamic imports for heavy components
- [ ] Measure bundle size reduction

---

### Task 3.2: API Documentation ⏳

**Priority:** 🟢 **P2 - MEDIUM**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Medium (3-5 days)

**Acceptance Criteria:**

- [ ] Generate OpenAPI spec from Zod schemas
- [ ] Install `swagger-ui-react` or Scalar
- [ ] Create `/api/docs` endpoint
- [ ] Document all API routes
- [ ] Add examples and error codes
- [ ] Test API documentation UI

---

### Task 3.3: RLS UUID Performance Optimization ⏳

**Priority:** 🟢 **P2 - MEDIUM**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Medium (2-3 days)

**Acceptance Criteria:**

- [ ] Replace all `::text` UUID casting (21 policies)
- [ ] Run query performance benchmarks before/after
- [ ] Verify <10ms improvement
- [ ] Update all affected tables
- [ ] Test in staging
- [ ] Apply to production

---

### Task 3.4: Feature Flags System ⏳

**Priority:** 🟢 **P2 - MEDIUM**
**Status:** ⏳ **Not Started**
**Owner:** Backend
**Effort:** Medium (3-5 days)

**Acceptance Criteria:**

- [ ] Implement feature flag library
- [ ] Create admin UI for feature flags
- [ ] Add flags for new features
- [ ] Enable gradual rollout capability
- [ ] Add A/B testing support

---

## Timeline & Milestones

### Phase 1: Pre-Production Hardening (2-3 weeks)

**Target Completion:** 2025-11-03
**Status:** 11% complete (1/9 tasks)

| Week   | Focus          | Tasks                                                  |
| ------ | -------------- | ------------------------------------------------------ |
| Week 1 | Security & RLS | 1.1 (RLS), 1.5 (Service Key), 1.9 (Credentials) ✅     |
| Week 2 | Infrastructure | 1.2 (Redis), 1.3 (Validation), 1.4 (Error Boundaries)  |
| Week 3 | Code Quality   | 1.6 (Metrics), 1.7 (Auth Middleware), 1.8 (TypeScript) |

### Phase 2: Production Launch (2-3 weeks)

**Target Completion:** 2025-11-24
**Status:** 0% complete (0/12 tasks)

| Week   | Focus               | Tasks                                                       |
| ------ | ------------------- | ----------------------------------------------------------- |
| Week 4 | Observability       | 2.1 (Sentry), 2.2 (Logging), 2.8 (CSP Reporting)            |
| Week 5 | API & Testing       | 2.4 (API Routes), 2.9 (Test Coverage), 2.11 (Health Checks) |
| Week 6 | Infrastructure      | 2.3 (CI/CD), 2.5 (PITR), 2.6 (Migrations), 2.12 (Staging)   |
| Week 7 | Optimization & Docs | 2.7 (Rendering), 2.10 (Runbooks)                            |

### Phase 3: Post-Launch Optimization (Ongoing)

**Target Start:** 2025-12-01
**Status:** 0% complete (0/4 tasks)

---

## Production Readiness Checklist

### Security ✅ = Complete, ⏳ = In Progress, ❌ = Not Started

- ⏳ All RLS policies implemented and tested
- ⏳ Service key usage properly separated from client code
- ❌ All API routes have Zod validation
- ❌ Authentication middleware enforces RBAC
- ❌ Rate limiting uses Redis (distributed store)
- ❌ CSP violations reported to Sentry
- ✅ Demo credentials endpoint removed or secured

### Observability

- ❌ Sentry configured for error tracking
- ❌ Structured logging with request IDs implemented
- ⏳ Health check verifies Supabase connectivity
- ❌ Real metrics endpoint (no mock data)
- ❌ Error boundaries implemented (error.tsx, not-found.tsx)

### Data & Reliability

- ❌ Supabase PITR enabled and verified
- ⏳ Migration discipline enforced (no console edits)
- ❌ Backup/restore tested in staging
- ❌ RPO/RTO documented

### Code Quality

- ⏳ `tsc --noEmit` passes with 0 errors (185 errors identified)
- ❌ `npm run lint` passes with acceptable warnings
- ❌ `ignoreBuildErrors` and `ignoreDuringBuilds` removed
- ❌ Test coverage ≥ 80% on services and API routes

### CI/CD

- ❌ GitHub Actions pipeline runs on all PRs
- ❌ Quality gates block merging (type-check, lint, tests)
- ❌ Preview deployments linked to staging Supabase
- ❌ Production deployment requires manual approval

### Operations

- ❌ Incident response runbook documented
- ❌ Rollback procedure documented and tested
- ❌ On-call rotation established
- ❌ Monitoring dashboards configured

---

## Cost Estimates

### Monthly Costs (Production)

| Service       | Purpose         | Tier           | Monthly Cost     |
| ------------- | --------------- | -------------- | ---------------- |
| Supabase      | Database + Auth | Pro            | $25              |
| Upstash Redis | Rate limiting   | Free/Pay-as-go | $0-20            |
| Sentry        | Error tracking  | Team           | $26              |
| Vercel        | Hosting         | Pro            | $20              |
| **Total**     |                 |                | **$71-91/month** |

### Development Time Investment

| Phase               | Duration      | FTE        | Total Effort   |
| ------------------- | ------------- | ---------- | -------------- |
| Phase 1 (P0)        | 2-3 weeks     | 2 devs     | 4-6 weeks      |
| Phase 2 (P1)        | 2-3 weeks     | 2 devs     | 4-6 weeks      |
| **Total to Launch** | **4-6 weeks** | **2 devs** | **8-12 weeks** |

---

## Risk Management

### High-Impact Risks

1. **RLS Policy Gaps** (🔴 Critical)
   - **Risk:** Authentication failure, data leakage
   - **Mitigation:** Phase 1, Task 1.1 (in progress)
   - **Fallback:** Manual RLS enforcement via service layer

2. **In-Memory Rate Limiting** (🔴 Critical)
   - **Risk:** DDoS vulnerability, inconsistent rate limiting
   - **Mitigation:** Phase 1, Task 1.2
   - **Fallback:** Vercel's built-in protection (limited)

3. **TypeScript Errors** (🔴 Critical)
   - **Risk:** Runtime errors, poor developer experience
   - **Mitigation:** Phase 1, Task 1.8 (in progress)
   - **Fallback:** Leave ignore flags (not recommended)

4. **No Observability** (🟡 High)
   - **Risk:** Cannot debug production issues
   - **Mitigation:** Phase 2, Tasks 2.1, 2.2
   - **Fallback:** Vercel logs (limited retention)

---

## Success Metrics

### Development Velocity

- Phase 1 completion: Target 2-3 weeks
- Type-check passing: Target 100% by Week 3
- Test coverage: Target 80% by Week 6

### Production Metrics (Post-Launch)

- **Uptime:** 99.9% target
- **TTFB:** < 600ms target
- **LCP:** < 2.5s target
- **Error Rate:** < 0.5% target
- **Response Time (p95):** < 1000ms target

### User Satisfaction

- Dashboard load time: < 3s target
- QR code scan success rate: > 95% target
- Auth failure rate: < 1% target

---

## Change Log

| Date       | Version | Changes                                            |
| ---------- | ------- | -------------------------------------------------- |
| 2025-10-13 | 2.0     | Complete overhaul based on backend gap analysis    |
| 2025-08-17 | 1.1     | Added data sheets and country-based syllabus tasks |
| 2025-08-15 | 1.0     | Initial task breakdown with phases                 |

---

**Next Review:** Weekly during Phase 1, bi-weekly post-Phase 1
**Document Owner:** Development Team
**Last Updated By:** Backend Gap Analysis Audit
