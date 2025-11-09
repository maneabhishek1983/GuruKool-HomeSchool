# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuruKool HomeSchool is a Next.js 14 application for managing homeschooling with AI-powered features, teacher-student tracking, QR code authentication, and comprehensive academic standards support for UK, US, and India.

**Node.js Version**: v20 (see [.nvmrc](.nvmrc))
**Package Manager**: npm (uses package-lock.json)

## Common Commands

### Development

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `ANALYZE=true npm run build` - Build with bundle analyzer

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript compiler checks (no emit)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

- `npm test` - Run Jest unit tests
- `npm test -- <test-file-pattern>` - Run specific test file(s) (e.g., `npm test -- session`)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:e2e:debug` - Debug E2E tests
- `npm run test:all` - Run all tests (unit + E2E)
- `npm run test:comprehensive` - Run comprehensive testing suite (all test types)
- `npm run test:performance` - Run performance benchmarks
- `npm run test:security` - Run security penetration tests
- `npm run test:security-verification` - Verify security implementation
- `npm run test:full-suite` - Run all test suites in sequence

### Database & Supabase

- `npm run verify:supabase` - Verify Supabase connection and schema
- `npm run verify:rls` - Verify Row Level Security policies
- Database migrations must be applied manually in Supabase Dashboard (see `supabase/migrations/`)

### Utilities

- `npm run storybook` - Start Storybook on port 6006
- `npm run build-storybook` - Build Storybook for production
- `npm run validate:tasks` - Validate implementation tasks
- `npm run check:status` - Check implementation status

## Architecture

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 18, Tailwind CSS, Framer Motion
- **Component Library**: Mantine UI
- **State Management**: Zustand (session store), React Query (TanStack Query)
- **Database**: Supabase (PostgreSQL + Auth)
- **AI/ML**: OpenAI API, Langchain, Pinecone (vector DB)
- **Testing**: Jest, Playwright, Testing Library, Storybook

### Key Directories

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── parent/            # Parent dashboard and features
│   ├── teacher/           # Teacher dashboard and sessions
│   ├── admin/             # Admin portal
│   ├── api/               # API routes
│   │   ├── students/      # Student CRUD endpoints
│   │   ├── teachers/      # Teacher CRUD endpoints
│   │   ├── sessions/      # Session CRUD endpoints
│   │   ├── contact-admin/ # Contact form endpoint
│   │   ├── health/        # Health check endpoint
│   │   └── metrics/       # Prometheus metrics endpoint
│   └── *-demo/            # Feature demo pages
├── components/            # React components
│   ├── auth/             # Authentication components (QR, fallback)
│   ├── parent/           # Parent-specific components
│   ├── teacher/          # Teacher-specific components
│   ├── analytics/        # Analytics dashboards
│   └── sessions/         # Session management components
├── agents/               # AI agent system
│   ├── base.agent.ts    # Abstract base agent class with health checks
│   ├── orchestrator.ts  # Agent orchestration with priority execution
│   └── registry.ts      # Agent registry and discovery
├── services/            # Business logic and external integrations
│   ├── database.service.ts      # Supabase CRUD with parent isolation
│   ├── qr-auth.service.ts       # QR code authentication
│   ├── teacher-qr.service.ts    # Teacher QR code management
│   ├── ai-insights.service.ts   # AI-powered insights
│   ├── analytics.service.ts     # Analytics processing
│   ├── session.service.ts       # Session management
│   ├── sync-manager.service.ts  # Offline sync
│   └── logging.service.ts       # Structured logging
├── lib/                 # Core libraries and utilities
│   ├── supabase.ts     # Supabase client configuration (client/server)
│   ├── validation.ts   # Zod validation schemas for all API inputs
│   ├── api-security.ts # Rate limiting and CSRF protection wrappers
│   ├── authContext.tsx # Authentication context
│   └── syncContext.tsx # Sync context
├── store/              # State management (Zustand)
│   └── session.store.ts # Session state singleton with caching
├── design-system/      # Custom design system
│   ├── components/     # Reusable UI components
│   ├── tokens/         # Design tokens (colors, typography, spacing)
│   ├── themes/         # Theme configuration
│   └── animations/     # Animation presets (Framer Motion)
├── types/              # TypeScript type definitions
│   └── index.ts        # Centralized type exports
└── middleware/         # Next.js middleware (currently unused - see lib/api-security.ts)
```

### AI Agent System

The application uses a sophisticated AI agent architecture:

- **BaseAgent** (`src/agents/base.agent.ts`): Abstract base class with health checks, metrics tracking, and error handling
- **Agent Orchestrator** (`src/agents/orchestrator.ts`): Coordinates multiple agents with priority-based execution
- **Agent Registry** (`src/agents/registry.ts`): Dynamic agent registration and discovery
- **Specialized Agents**:
  - `auth-verification.agent.ts` - Multi-factor authentication and risk scoring
  - `analytics.agent.ts` - Learning analytics and progress tracking
  - `task-automation.agent.ts` - Automated task scheduling and batch processing
  - `communication.agent.ts` - Smart notifications and alerts
  - `security-analysis.agent.ts` - Security threat detection

### Authentication System

Multi-layered authentication approach:

1. **Teacher QR Authentication**: Student-specific QR codes for teacher sign-in/sign-out
2. **QR Auth Service**: Token-based QR authentication with expiry
3. **Supabase Auth**: Primary authentication backend
4. **AI-Enhanced Auth**: Risk scoring and behavioral analysis
5. **Fallback Auth**: Manual authentication when QR fails

### Database Schema

Key tables in Supabase:

- `users` - User accounts (parent/teacher/admin)
- `students` - Student profiles with academic standards
- `teachers` - Teacher profiles with qualifications
- `sessions` - Teaching sessions with location tracking
- `teacher_qr_codes` - Student-specific QR codes for teachers
- `teacher_sessions` - Session logs with verification
- `ai_insights` - AI-generated insights and recommendations
- `learning_analytics` - Progress metrics and patterns

### Data Persistence & Caching

- **Database Service** (`database.service.ts`): Handles CRUD for students and teachers with proper parent isolation
  - Uses in-memory cache for read-heavy data (30s TTL for users, 15s for sessions)
  - Cache invalidation on writes (upsert, update)
  - Exposes both client-safe methods (anon key) and server-only methods (service role)
- **Session Store** (`session.store.ts`): Zustand singleton with:
  - Multiple indexes (by student, teacher, parent)
  - AI insights cache and learning patterns cache
  - Sample data initialization for development
  - `clearAll()` and `resetToSampleData()` for testing
- **Teacher Assignment**: Students can be assigned to multiple teachers; QR codes auto-generated on assignment
- **Profile Management**: Separate creation flows for students (parent dashboard) and teachers (parent-created)

## Production Deployment

### Hosting Platform

- **Primary**: Vercel (preferred for Next.js 14 App Router)
- **Fallback**: Container-based deployment for preview/dev environments only

### Data & Authentication

- **Source of Truth**: Supabase (PostgreSQL + Auth)
- All database operations and authentication flow through Supabase
- Row Level Security (RLS) must be enforced on all tables
- Use `supabase/migrations/` for version-controlled schema changes
  - Existing migrations: initial schema, data sheets, timesheet, teachers, QR codes, RLS policies
  - All migrations are numbered sequentially (001, 002, 003, etc.)

### Environment Configuration

Required environment variables (see `.env.example`):

#### Supabase (All Environments)

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public, RLS-protected)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, never expose to client)

#### AI/ML

- `OPENAI_API_KEY` - OpenAI API key (server-side only; local dev only, production uses alternative)
- `PINECONE_API_KEY` - Pinecone vector DB key
- `PINECONE_ENVIRONMENT` - Pinecone environment

#### Security

- `JWT_SECRET` - JWT signing secret

#### Redis & Rate Limiting

- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL for distributed rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis authentication token

#### Other

- `NEXT_PUBLIC_WS_URL` - WebSocket URL for real-time features
- `MCP_*_ENDPOINT` - MCP server endpoints (education, security, communication)
- `SENTRY_DSN` - Sentry error tracking DSN (optional)
- `SENTRY_AUTH_TOKEN` - Sentry authentication token (optional)

#### Development/Staging Only

- `DEMO_PARENT_PASSWORD` - Demo parent account password
- `DEMO_ADMIN_PASSWORD` - Demo admin account password
- `DEMO_TEACHER_PASSWORD` - Demo teacher account password
- `ENABLE_DEMO_CREDENTIALS` - Enable/disable demo credentials (set to `false` in production)

### Environment Strategy

- **Development**: Use OpenAI API key for local LLM testing
- **Production**: Use Chomsky LLM, OKTA (future integration), and APIM (future integration)
- **Vercel Environments**: Configure separate env groups for `Development`, `Preview`, `Production`
- Document all production environment variables in `VERCEL_ENV_VARS.txt`

### Deployment Workflow

1. Push to GitHub triggers Vercel build
2. Preview deployments for all branches
3. Production deployment on merge to `main`
4. Run `npm run type-check` and `npm run lint` in CI before deploy
5. Playwright E2E tests gate production deployments

## TypeScript & Build Configuration

### TypeScript (tsconfig.json)

- **Strict mode enabled** with additional safety checks:
  - `noUncheckedIndexedAccess: true` - Arrays/objects require explicit undefined checks
  - `exactOptionalPropertyTypes: true` - `foo?: string` only allows `string | undefined`, not `null`
  - `noImplicitReturns: true` - All code paths must return a value
  - `noFallthroughCasesInSwitch: true` - Switch cases must break/return
  - `noUncheckedSideEffectImports: true` - Side-effect imports must be validated

- **Path aliases** configured (also mirrored in `next.config.mjs` webpack config):
  - `@/*` → `src/*`
  - `@/components/*` → `src/components/*`
  - `@/lib/*` → `src/lib/*`
  - `@/store/*` → `src/store/*`
  - `@/types/*` → `src/types/*`
  - `@/agents/*` → `src/agents/*`
  - `@/services/*` → `src/services/*`
  - `@/design-system/*` → `src/design-system/*`

### Next.js Configuration (next.config.mjs)

- **Webpack Configuration**:
  - Custom alias resolution for `@/` path
  - Fallbacks for Node.js modules: `fs: false, net: false, tls: false`
- **Build Behavior**:
  - `eslint.ignoreDuringBuilds: false` (enforced in all environments)
  - `typescript.ignoreBuildErrors: false` (enforced in all environments)
  - Quality gates are enforced both locally and in CI/CD
- **Security Headers**: Applied globally via `headers()` async function (see Security section)

## Code Patterns

### Type Safety

All types centralized in `src/types/index.ts`. Import from `@/types` rather than relative paths.

### Service Layer

Services in `src/services/` handle all business logic and external integrations. Components should import services, not implement business logic.

### Component Structure

- Use functional components with TypeScript
- Prefer composition over inheritance
- Implement proper error boundaries
- Use React Query for server state
- Use Zustand for client state

### AI Agent Development

When creating new agents:

1. Extend `BaseAgent` from `@/agents/base.agent`
2. Implement required properties: `id`, `name`, `capabilities`, `priority`
3. Implement `execute(context: AgentContext): Promise<AgentResult>`
4. Override `validateContext()` for custom validation
5. Use `createInsight()` and `log()` helper methods
6. Register in `src/agents/registry.ts`

### API Route Development

When creating API routes in `src/app/api/`:

1. **Authentication Pattern**: Extract Bearer token → Create Supabase client → Call `getUser()`

   ```typescript
   const authHeader = request.headers.get('authorization');
   const supabase = createClient(url, key, {
     global: { headers: { Authorization: authHeader } },
   });
   const {
     data: { user },
     error,
   } = await supabase.auth.getUser();
   ```

2. **Validation**: Use Zod schemas from `@/lib/validation`

   ```typescript
   const validation = studentCreateSchema.safeParse(body);
   if (!validation.success) {
     return NextResponse.json(createValidationErrorResponse(validation.error), {
       status: 400,
     });
   }
   ```

3. **Rate Limiting**: Wrap handlers with `withRateLimit` from `@/lib/api-security`

   ```typescript
   export const POST = withRateLimit({
     keyPrefix: 'api:students:create',
     max: 20,
   })(async (request: NextRequest) => {
     /* ... */
   });
   ```

4. **Parent Isolation**: Always pass `user.id` to `DatabaseService` methods or use RLS with Supabase queries

### Database Operations

Use `DatabaseService` static methods for CRUD operations:

- `getStudents(parentId)` / `createStudent(data, parentId)`
- `getTeachers(parentId)` / `createTeacher(data, parentId)`
- `updateStudent(id, data, parentId)` / `updateTeacher(id, data, parentId)`
- `assignTeacherToStudent(teacherId, studentId, parentId)`

All methods enforce parent isolation. QR codes are automatically generated on teacher assignment.

### Offline Support

Use `offline-storage.service.ts` and `sync-manager.service.ts` for offline-first features. Queue actions when offline and sync when connection restored.

## Academic Standards

Supports three educational systems:

- **UK**: Year-based system (Foundation to Year 13)
- **US**: Grade-based system (Pre-K to Grade 12)
- **India**: Class-based system (Nursery to Class 12)

Each system has country-specific subjects, assessment methods, and learning outcomes. See `src/services/academic-standards.service.ts`.

## Design System

Custom design system in `src/design-system/`:

- **Tokens**: Colors, typography, spacing, shadows, borders
- **Components**: Button, Card, Container, Text, Forms, Feedback
- **Themes**: Light/dark themes with context provider
- **Animations**: Framer Motion presets and variants

Use design system components instead of raw Tailwind classes when possible.

## Testing Strategy

- **Unit Tests**: Jest + Testing Library for components and services
- **E2E Tests**: Playwright for full user journeys
- **Storybook**: Component development and visual testing
- **Security Tests**: Penetration testing suite in `scripts/` directory
- **Performance Tests**: Performance benchmarking suite
- **Regression Tests**: Automated regression testing
- **Coverage**: Aim for >80% on business logic

### Test Utility Scripts

The `scripts/` directory contains utility scripts:

- `verify-supabase-connection.js` - Verify Supabase connectivity and schema (no external dependencies)
- `verify-rls-policies.js` - Verify Row Level Security policies
- `comprehensive-testing.js` - Run comprehensive test suite
- `performance-testing.js` - Run performance benchmarks
- `security-verification.js` - Verify security implementation

These scripts use manual `.env` file parsing (no `dotenv` dependency required).

## Security & Production Hardening

### Current Security Measures

- **Rate Limiting**: Implemented via `withRateLimit()` wrapper in `src/lib/api-security.ts`
  - In-memory store per route (consider Redis for production)
  - Configurable window, max requests, and key prefix
  - Returns 429 with Retry-After header
- **CSRF Protection**: Implemented via `withCSRFProtection()` wrapper in `src/lib/api-security.ts`
  - Token validation for state-changing methods (POST/PUT/DELETE/PATCH)
  - Currently not used in API routes (authentication via Bearer token instead)
- **Input Validation**: Zod schemas in `src/lib/validation.ts` for all API inputs
  - Comprehensive validation for students, teachers, sessions, auth
  - Type-safe with TypeScript inference
  - Formatted error responses via `createValidationErrorResponse()`
- **Content Security Policy**: Configured in `next.config.mjs`
  - Environment-aware CSP (stricter in production)
  - Restricts script sources, connect sources, and frame sources
  - Blocks object embeds and enforces HTTPS upgrades
- **Security Headers**: Set via `next.config.mjs` headers()
  - X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy
- **QR Codes**: 5-minute expiration, student-specific
- **Authentication**: Supabase auth with Bearer tokens, parent isolation via RLS
- **API Key Management**: Never commit `.env`, use separate keys for dev/prod
- `poweredByHeader: false` to hide Next.js signature

### Production Hardening Checklist

#### Supabase Security

- [ ] Enforce Row Level Security (RLS) on all tables
- [ ] Create least-privilege RLS policies (version in `supabase/migrations/`)
- [ ] Rotate `NEXT_PUBLIC_SUPABASE_ANON_KEY` if exposed
- [ ] Keep service role key only in server environment variables (never client-side)
- [ ] Enable Supabase PITR backups and document RPO/RTO

#### Secrets & Environment Management

- [ ] Create Vercel environment groups for `Development`, `Preview`, `Production`
- [ ] Move server-only secrets (`OPENAI_API_KEY`, service keys) to server-only routes
- [ ] Use `server-only` package imports for sensitive utilities
- [ ] Document all production env vars in `VERCEL_ENV_VARS.txt`

#### Content Security Policy (CSP)

- [ ] Tighten CSP in `next.config.mjs` for production:
  - Drop `'unsafe-eval'` and `vercel.live` domains in production
  - Restrict `connect-src` to Supabase and required domains only
  - Add `report-uri` for CSP violations
- [ ] Keep `poweredByHeader=false`

#### Input Validation & Abuse Protection

- [x] Add Zod schemas to all `src/app/api/*` route handlers (completed for students, teachers, sessions, contact)
- [x] Implement per-IP rate limits on API endpoints (in-memory store)
- [ ] Migrate rate limiting to Redis (Upstash) for distributed/production use
- [ ] Add per-user rate limits (requires user ID tracking)
- [ ] Add CAPTCHA (hCaptcha) for signup/contact flows
- [x] Return typed error responses (no stack traces to client)

#### Dependencies & Audit

- [ ] Enable `npm audit` in CI pipeline
- [ ] Configure GitHub Dependabot or weekly security alerts
- [ ] Review and update dependencies regularly

#### Observability & Monitoring

- [ ] Add Sentry for error tracking (frontend + backend)
- [ ] Implement structured logging with request IDs (e.g., pino)
- [ ] Redact PII from logs
- [ ] Enable Vercel Analytics and Web Vitals monitoring
- [ ] Set up synthetic health checks (Playwright cron or Vercel Cron)

#### Error Handling

- [ ] Implement `src/app/error.tsx` and `src/app/not-found.tsx`
- [ ] Add error boundaries for critical routes
- [ ] Ensure `/api/health` endpoint with Supabase connectivity check exists

#### CI/CD Quality Gates

- [ ] Remove `ignoreBuildErrors` and `eslint.ignoreDuringBuilds` from `next.config.mjs` in CI
- [ ] Enforce `tsc --noEmit` passes in CI
- [ ] Require green checks (lint, type-check, unit, e2e) before Vercel deploy
- [ ] Expand Playwright E2E: auth flows, QR flows, admin journeys
- [ ] Add contract tests for API routes with mock Supabase

#### Authentication & Authorization

- [ ] Centralize auth guards in reusable components (e.g., `AuthGuard.tsx`)
- [ ] Ensure RLS policies mirror UI permission checks
- [ ] Handle session refresh on server using `@supabase/ssr` cookies in `middleware.ts`
- [ ] Split `src/lib/supabase.ts` into client/server modules with proper key scoping

#### Performance & Cost Optimization

- [ ] Prefer static/ISR for read-heavy pages; use SSR only where needed
- [ ] Set `revalidate` on data-fetching components; cache Supabase reads
- [ ] Move lightweight endpoints to Edge Runtime (keep service-key operations on Node runtime)
- [ ] Enable Next.js Image optimization; audit large images
- [ ] Run bundle analyzer; code-split large routes/components

#### Data Migrations & Versioning

- [ ] Use SQL migrations in `supabase/migrations/` exclusively (no ad-hoc console edits)
- [ ] Test migrations in staging before production
- [ ] Document rollback procedures

### Acceptance Criteria for Production Readiness

- All CI gates pass with 0 TypeScript errors and acceptable ESLint warnings
- Sentry captures errors; Vercel Web Vitals within budget (TTFB, LCP, CLS)
- Auth and RLS verified via automated tests; no privileged data accessible unauthenticated
- Rollback tested; migrations repeatable in staging and production
- Incident response runbooks documented in `/docs`

## Important Notes

- **No Mock Data**: Never generate dummy/mock data in production code (per project requirements)
- **Chomsky LLM**: Keep `chomsky--0.17.9/` directory for production deployments
- **Environment Separation**: Local dev uses OpenAI API key; production uses Chomsky + OKTA + APIM
- **Database Migrations**: Apply via Supabase Dashboard only - no CLI or programmatic migrations
  - See `supabase/migrations/` for SQL files (001-006)
  - Migrations must be applied in sequence
  - See `QUICK_START_MIGRATIONS.md` for step-by-step guide
- **API Documentation**: Complete API reference in `API_DOCUMENTATION.md` with cURL examples
- **Testing Status**: QA report in `QA_TEST_REPORT.md` shows current test coverage and gaps

## Key Architectural Decisions & Gotchas

### Authentication Flow

- API routes use **Bearer token authentication** (not session cookies)
- Extract token from `Authorization` header → Create Supabase client with token → Call `getUser()`
- Do NOT use `withCSRFProtection()` on API routes (Bearer tokens are already CSRF-safe)
- RLS policies in Supabase enforce parent isolation at the database level

### Rate Limiting

- Current implementation uses **in-memory Map** (loses state on server restart)
- Each route has its own bucket: `keyPrefix:route:ip:timeBucket`
- **Limitation**: Does not work across multiple Vercel serverless instances
- **TODO**: Migrate to Redis (Upstash) for distributed rate limiting in production

### Validation Approach

- All validation uses **Zod schemas** from `@/lib/validation.ts`
- Never validate manually with `if` statements
- Use `safeParse()` (returns result object) not `parse()` (throws error)
- Format errors with `createValidationErrorResponse()` for consistent API responses

### Session Store Singleton

- `EnhancedSessionStore.getInstance()` returns singleton
- **Important for tests**: Always call `clearAll()` in `beforeEach` to prevent test pollution
- Sample data is loaded on first instantiation (for development only)

### Environment Variables

- Verification scripts in `scripts/` use **manual .env parsing** (no `dotenv` dependency)
- This avoids adding `dotenv` to production dependencies
- Scripts read `.env` file using `fs.readFileSync()` and parse key=value pairs manually

### Supabase Client Configuration

- `src/lib/supabase.ts` exports both:
  - `supabase` - Client-side with anon key (safe for browser, protected by RLS)
  - `getSupabaseAdmin()` - Server-side with service role key (bypasses RLS, server-only)
- Never import service role key in client components
- Use `@supabase/ssr` for server-side auth in middleware/SSR pages

### Middleware Files (src/middleware/)

- `csrf.ts`, `rate-limit.ts`, `security-headers.ts` are **NOT Next.js middleware**
- They are utility modules, not `middleware.ts` file
- Actual implementation: `withRateLimit()` and `withCSRFProtection()` wrappers in `src/lib/api-security.ts`
- Security headers are set via `next.config.mjs` headers() function

### Real-Time Communication

- **Migration**: Migrated from WebSocket to **Supabase Realtime** (see recent commits)
- Use Supabase Realtime subscriptions for live session updates
- Connection via `wss://*.supabase.co` (configured in CSP headers)
- Eliminates need for separate WebSocket server infrastructure
