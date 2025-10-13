# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuruKool HomeSchool is a Next.js 14 application for managing homeschooling with AI-powered features, teacher-student tracking, QR code authentication, and comprehensive academic standards support for UK, US, and India.

## Common Commands

### Development

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript compiler checks (no emit)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:e2e:debug` - Debug E2E tests
- `npm run test:all` - Run all tests (unit + E2E)
- `npm run test:comprehensive` - Run comprehensive testing suite
- `npm run test:security` - Run security penetration tests
- `npm run test:full-suite` - Run all test suites

### Utilities

- `npm run storybook` - Start Storybook on port 6006
- `npm run build-storybook` - Build Storybook for production

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
├── app/                    # Next.js App Router pages
│   ├── parent/            # Parent dashboard and features
│   ├── teacher/           # Teacher dashboard and sessions
│   ├── admin/             # Admin portal
│   ├── api/               # API routes (health, metrics, credentials)
│   └── *-demo/            # Feature demo pages
├── components/            # React components
│   ├── auth/             # QR auth, fallback auth, AI auth flow
│   ├── parent/           # Parent-specific components
│   ├── teacher/          # Teacher-specific components
│   ├── analytics/        # Analytics dashboards
│   └── sessions/         # Session management
├── agents/               # AI agent system
│   ├── core/            # Base agent infrastructure
│   ├── base.agent.ts    # Abstract base agent class
│   ├── orchestrator.ts  # Agent orchestration
│   └── registry.ts      # Agent registry
├── services/            # Business logic and external integrations
│   ├── database.service.ts      # Supabase CRUD operations
│   ├── qr-auth.service.ts       # QR code authentication
│   ├── teacher-qr.service.ts    # Teacher QR code management
│   ├── ai-insights.service.ts   # AI-powered insights
│   ├── analytics.service.ts     # Analytics processing
│   ├── session.service.ts       # Session management
│   └── sync-manager.service.ts  # Offline sync
├── design-system/       # Custom design system
│   ├── components/      # Reusable UI components
│   ├── tokens/          # Design tokens (colors, typography, spacing)
│   ├── themes/          # Theme configuration
│   └── animations/      # Animation presets
├── lib/                 # Core libraries and contexts
│   ├── supabase.ts     # Supabase client configuration
│   ├── authContext.tsx # Authentication context
│   └── syncContext.tsx # Sync context
├── store/              # State management
│   └── session.store.ts # Session state (Zustand)
├── types/              # TypeScript type definitions
│   └── index.ts        # Centralized type exports
└── middleware/         # Next.js middleware
    ├── csrf.ts         # CSRF protection
    ├── rate-limit.ts   # Rate limiting
    └── security-headers.ts # Security headers
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

### Data Persistence

- **Database Service** (`database.service.ts`): Handles CRUD for students and teachers with proper parent isolation
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

#### Other

- `NEXT_PUBLIC_WS_URL` - WebSocket URL for real-time features
- `MCP_*_ENDPOINT` - MCP server endpoints (education, security, communication)

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

## TypeScript Configuration

- **Strict mode enabled** with additional safety checks:
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`

- **Path aliases** configured (`tsconfig.json`):
  - `@/*` → `src/*`
  - `@/components/*` → `src/components/*`
  - `@/lib/*` → `src/lib/*`
  - `@/store/*` → `src/store/*`
  - `@/types/*` → `src/types/*`
  - `@/agents/*` → `src/agents/*`
  - `@/services/*` → `src/services/*`
  - `@/design-system/*` → `src/design-system/*`

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

### Database Operations

Always use `DatabaseService` static methods for database operations:

- `getStudents(parentId)` / `createStudent(data, parentId)`
- `getTeachers(parentId)` / `createTeacher(data, parentId)`
- `assignTeacherToStudent(teacherId, studentId, parentId)`
- Automatically creates QR codes on assignment

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
- **Security Tests**: Penetration testing suite
- **Coverage**: Aim for >80% on business logic

## Security & Production Hardening

### Current Security Measures

- CSRF protection middleware active (`src/middleware/csrf.ts`)
- Rate limiting on API routes (`src/middleware/rate-limit.ts`)
- Security headers configured (`src/middleware/security-headers.ts`)
- QR codes expire after 5 minutes
- Teacher sessions require verification
- API key management (never commit `.env`)

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

- [ ] Add Zod schemas to all `src/app/api/*` route handlers
- [ ] Implement per-IP and per-user rate limits on critical endpoints
- [ ] Add CAPTCHA (hCaptcha) for signup/contact flows
- [ ] Return typed error responses (no stack traces to client)

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

- **No Mock Data**: Never generate dummy/mock data in production code
- **Chomsky LLM**: Keep `chomsky--0.17.9/` directory for production deployments
- **Environment Separation**: Local dev uses OpenAI; production uses Chomsky + OKTA + APIM
- **Git Commits**: Auto-generated commits include Claude Code attribution
- **PGVector**: Reference `@PG_RAG.ipynb` notebook for vector embedding examples (other project, but relevant)
