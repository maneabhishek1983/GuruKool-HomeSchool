# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuruKool HomeSchool is a Next.js 14 PWA for managing homeschooling with AI-powered features, teacher-student tracking, QR code / face recognition authentication, and academic standards support for UK, US, and India.

- **Node.js**: 20 (see `.nvmrc`)
- **Package Manager**: npm
- **Deploy**: Vercel (production) | Supabase (database + auth)

---

## Essential Commands

```bash
# Development
npm run dev              # Start dev server at localhost:3000
npm run build            # Production build
npm run type-check       # CRITICAL: Run before every push to catch Vercel errors

# Testing
npm test                 # Jest unit tests
npm test -- <pattern>    # Single test file (e.g., npm test -- session)
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Coverage report
npm run storybook        # Component dev at localhost:6006

# Code Quality
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier formatting

# Database
npm run verify:supabase  # Verify Supabase connection
npm run verify:rls       # Verify RLS policies
npm run db:push          # Push migrations to Supabase
```

**Pre-commit**: Husky runs `lint-staged` which auto-runs `eslint --fix` + `prettier --write` on `*.{js,jsx,ts,tsx}` and `prettier --write` on `*.{json,md,css}`.

---

## Architecture

### Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Framework | Next.js 14 (App Router), PWA via next-pwa         |
| UI        | React 18, Tailwind CSS, Mantine UI, Framer Motion |
| State     | Zustand (client), React Query (server)            |
| Database  | Supabase (PostgreSQL + Auth + Realtime)           |
| AI/ML     | OpenAI (dev), Langchain, Pinecone                 |
| Testing   | Jest, Playwright, Storybook                       |

### Key Directory Structure

```
src/
├── app/                 # Next.js App Router (pages + API routes)
│   ├── api/            # API endpoints (students, teachers, sessions, etc.)
│   ├── parent/         # Parent dashboard
│   ├── teacher/        # Teacher dashboard
│   └── admin/          # Admin portal
├── agents/             # AI agent system (BaseAgent, Orchestrator, Registry)
├── components/         # React components (organized by feature)
├── services/           # Business logic (database, QR, analytics, etc.)
├── lib/                # Core utilities (supabase, validation, api-security)
├── store/              # Zustand stores
├── types/              # Centralized TypeScript types
└── design-system/      # Custom UI components and tokens
```

### Core Services

| Service                   | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `database.service.ts`     | Supabase CRUD with parent isolation + caching |
| `teacher-qr.service.ts`   | Student-specific QR codes for teacher auth    |
| `session.service.ts`      | Teaching session management                   |
| `sync-manager.service.ts` | Offline-first data sync                       |

---

## Critical Patterns

### API Route Authentication

All API routes use **Bearer token authentication** (not cookies):

```typescript
// Extract token → Create client → Get user
const authHeader = request.headers.get('authorization');
const supabase = createClient(url, key, {
  global: { headers: { Authorization: authHeader } },
});
const {
  data: { user },
} = await supabase.auth.getUser();
```

### Input Validation

Always use **Zod schemas** from `@/lib/validation.ts`:

```typescript
const validation = studentCreateSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json(createValidationErrorResponse(validation.error), {
    status: 400,
  });
}
```

### Rate Limiting

Wrap handlers with `withRateLimit` from `@/lib/api-security`:

```typescript
export const POST = withRateLimit({
  keyPrefix: 'api:students:create',
  max: 20,
})(async (request: NextRequest) => {
  /* ... */
});
```

**Note**: Rate limiting currently uses in-memory Map. Upstash Redis is configured (see `.env.example`) but migration is incomplete.

### Parent Data Isolation

- Always pass `parentId` to `DatabaseService` methods
- RLS policies enforce isolation at database level
- Never expose data from other parents

### Supabase Clients

| Export                              | Use Case                                    |
| ----------------------------------- | ------------------------------------------- |
| `supabase` (from `lib/supabase.ts`) | Client-side, anon key, RLS-protected        |
| `getSupabaseAdmin()`                | Server-only, service role key, bypasses RLS |

Never import service role key in client components.

---

## TypeScript Configuration

Strict mode with additional safety checks:

- `noUncheckedIndexedAccess: true` - Arrays require explicit undefined checks
- `exactOptionalPropertyTypes: true` - `foo?: string` means `string | undefined`, not `null`
- `noImplicitReturns: true` - All code paths must return
- `noFallthroughCasesInSwitch: true` - Switch cases must break/return

Path aliases: `@/*` → `src/*`, `@/components/*`, `@/lib/*`, `@/services/*`, etc.

---

## QR Authentication System

Teachers use student-specific QR codes for check-in/check-out.

QR codes contain: `teacherId`, `studentId`, `parentId`, `timestamp`, `signature`

- 5-minute expiration
- HMAC signature for validation
- QR code is always available as fallback when face recognition fails

---

## Face Recognition System

Face recognition provides an alternative verification method with QR code as fallback.

**CRITICAL**: All face matching is done SERVER-SIDE. Never trust client-provided confidence scores.

```
Client (Detection Only)          Server (Verification)
┌─────────────────────┐         ┌─────────────────────────────┐
│ 1. Camera capture   │         │ 4. Decrypt stored descriptor│
│ 2. Face detection   │────────>│ 5. Calculate distance       │
│ 3. Extract descriptor│         │ 6. Return match result      │
│    (128 floats)     │         │ 7. Log audit entry          │
└─────────────────────┘         └─────────────────────────────┘
```

Key files: `lib/face-encryption.ts` (AES-256-GCM), `lib/face-matching.ts` (server-side distance). Face-api.js models are in `public/models/face-api/`.

API endpoints: `/api/student/face-enroll` (POST/GET/DELETE), `/api/teacher-sessions/verify-face` (POST), `/api/teacher-sessions/check-in-face` (POST).

---

## Database Migrations

Migrations are in `supabase/migrations/` (001-016+). Apply via Supabase Dashboard SQL Editor.

Key tables: `users`, `students`, `teachers`, `sessions`, `teacher_qr_codes`, `teacher_sessions`, `timesheet_entries`, `teacher_invitation_tokens`

Critical relationships:

- `teacher_sessions` → `timesheet_entries` via PostgreSQL trigger (migration 007)
- Students can be assigned to multiple teachers; QR codes auto-generated on assignment

---

## AI Agent System

Extend `BaseAgent` from `@/agents/base.agent`. Register in `src/agents/registry.ts`. The Orchestrator handles priority-based execution.

---

## Environment Variables

See `.env.example` for all variables with descriptions.

**Required** (all environments):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `JWT_SECRET`
- `QR_SECRET` (server-only; `.env.example` uses `QR_SECRET`, not `NEXT_PUBLIC_QR_SECRET`)

**Face Recognition**:

- `FACE_ENCRYPTION_KEY` (64-char hex, generate with `openssl rand -hex 32`)
- `FACE_MATCH_THRESHOLD` (default 0.4), `FACE_VERIFY_RATE_LIMIT` (default 10/min)
- `NEXT_PUBLIC_ENABLE_FACE_RECOGNITION` (feature flag)

**AI** (dev uses OpenAI; production uses Chomsky LLM + OKTA + APIM):

- `OPENAI_API_KEY` (local dev only)
- `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`

**Optional**: `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (distributed rate limiting), `SENTRY_DSN` (error tracking), `ENABLE_DEMO_CREDENTIALS` (dev/staging only).

---

## CI/CD

GitHub Actions workflow (`.github/workflows/comprehensive-testing.yml`) runs on push to main/develop, PRs, and daily at 2 AM UTC. Includes unit tests, E2E (Playwright across Chromium/Firefox/WebKit), security tests, regression tests, and performance tests. Auto-comments results on PRs.

---

## Security Headers

`next.config.mjs` configures CSP, HSTS, X-Frame-Options, and other security headers for all routes. The `poweredByHeader` is disabled. Camera permission is allowed (`self`) for face recognition.

---

## Key Gotchas

1. **Session Store Singleton**: `EnhancedSessionStore.getInstance()`. Call `clearAll()` in test `beforeEach`.

2. **Two middleware layers**: The actual Next.js middleware is at root `middleware.ts` — it handles session propagation, role-based route protection (parent/teacher/admin), Redis rate limiting for API routes, CSRF tokens, and request ID correlation. Separately, `src/middleware/` contains reusable utilities (`csrf.ts`, `rate-limit.ts`) imported by the root middleware. Additionally, `lib/api-security.ts` provides `withRateLimit()` for per-route rate limiting inside API handlers.

3. **Scripts use manual .env parsing**: No `dotenv` dependency. Scripts read `.env` directly.

4. **Real-time via Supabase**: Migrated from WebSocket to Supabase Realtime. No separate WS server needed.

5. **CSRF not used on API routes**: Bearer tokens are already CSRF-safe.

6. **PWA disabled in development**: Service worker only active in production builds (configured in `next.config.mjs`).

7. **ESLint rules**: `no-console` is `warn` (not error) — console statements won't block builds but will show warnings. `eqeqeq` is `error` — always use `===`.

---

## Important Project Rules

- **No Mock Data**: Never generate dummy/mock data in production code
- **Type Check Before Push**: Always run `npm run type-check` before pushing
- **Chomsky LLM**: Keep `chomsky--0.17.9/` directory for production

---

## Academic Standards

Three educational systems supported:

- **UK**: Year-based (Foundation to Year 13)
- **US**: Grade-based (Pre-K to Grade 12)
- **India**: Class-based (Nursery to Class 12)

See `src/services/academic-standards.service.ts` for implementation.

---

## Related Documentation

- [README.md](README.md) - User guides and feature documentation
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [QUICK_START_MIGRATIONS.md](QUICK_START_MIGRATIONS.md) - Database setup
- [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md) - Architecture roadmap
