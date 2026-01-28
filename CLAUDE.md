# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuruKool HomeSchool is a Next.js 14 application for managing homeschooling with AI-powered features, teacher-student tracking, QR code authentication, and academic standards support for UK, US, and India.

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

# Code Quality
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier formatting

# Database
npm run verify:supabase  # Verify Supabase connection
npm run verify:rls       # Verify RLS policies
npm run db:push          # Push migrations to Supabase
```

**Pre-commit**: Husky runs `lint-staged` automatically on staged files.

---

## Architecture

### Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Framework | Next.js 14 (App Router)                           |
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

**Note**: Current rate limiting uses in-memory Map (not distributed). TODO: Migrate to Redis.

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

Path aliases: `@/*` → `src/*`, `@/components/*`, `@/lib/*`, `@/services/*`, etc.

---

## QR Authentication System

Teachers use student-specific QR codes for check-in/check-out:

| Component           | Location                                  | Purpose                   |
| ------------------- | ----------------------------------------- | ------------------------- |
| QRScanner           | `components/shared/QRScanner.tsx`         | Production camera scanner |
| QRScannerSimulation | `components/demo/QRScannerSimulation.tsx` | Mock for testing          |
| QRManualEntry       | `components/shared/QRManualEntry.tsx`     | Fallback text input       |

QR codes contain: `teacherId`, `studentId`, `parentId`, `timestamp`, `signature`

- 5-minute expiration
- HMAC signature for validation

---

## Face Recognition System

Face recognition provides an alternative verification method with QR code as fallback.

### Security Architecture

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

### Key Components

| Component          | Location                               | Purpose                               |
| ------------------ | -------------------------------------- | ------------------------------------- |
| FaceScanner        | `components/shared/FaceScanner.tsx`    | Camera + face detection UI            |
| FaceCheckIn        | `components/teacher/FaceCheckIn.tsx`   | Teacher verification with QR fallback |
| FaceEnrollment     | `components/parent/FaceEnrollment.tsx` | Student face enrollment wizard        |
| face-encryption.ts | `lib/face-encryption.ts`               | AES-256-GCM encryption                |
| face-matching.ts   | `lib/face-matching.ts`                 | Server-side distance calculation      |

### API Endpoints

| Endpoint                              | Method | Purpose                           |
| ------------------------------------- | ------ | --------------------------------- |
| `/api/student/face-enroll`            | POST   | Enroll student face (encrypted)   |
| `/api/student/face-enroll`            | GET    | Check enrollment status           |
| `/api/student/face-enroll`            | DELETE | Remove face data                  |
| `/api/teacher-sessions/verify-face`   | POST   | Server-side face verification     |
| `/api/teacher-sessions/check-in-face` | POST   | Create session after verification |
| `/api/teacher/assigned-students`      | GET    | Get students with face status     |

### Environment Variables

```bash
FACE_ENCRYPTION_KEY=<64-char-hex>  # openssl rand -hex 32
FACE_MATCH_THRESHOLD=0.4           # Distance threshold (default)
FACE_VERIFY_RATE_LIMIT=10          # Verifications per minute
NEXT_PUBLIC_ENABLE_FACE_RECOGNITION=true
```

### QR Code Fallback

QR code verification is **always available** as a fallback when:

- Face recognition models fail to load
- Camera access is denied
- Face doesn't match
- Network issues prevent server verification

---

## Database Migrations

Migrations are in `supabase/migrations/` (001-016+). Apply via Supabase Dashboard SQL Editor.

Key tables: `users`, `students`, `teachers`, `sessions`, `teacher_qr_codes`, `teacher_sessions`, `timesheet_entries`, `teacher_invitation_tokens`

Critical relationships:

- `teacher_sessions` → `timesheet_entries` via PostgreSQL trigger (migration 007)
- Students can be assigned to multiple teachers; QR codes auto-generated on assignment

---

## AI Agent System

Extend `BaseAgent` from `@/agents/base.agent`:

```typescript
class MyAgent extends BaseAgent {
  id = 'my-agent';
  name = 'My Agent';
  capabilities = ['capability1'];
  priority = 5;

  async execute(context: AgentContext): Promise<AgentResult> {
    // Implementation
  }
}
```

Register in `src/agents/registry.ts`. The Orchestrator handles priority-based execution.

---

## Environment Variables

**Required** (all environments):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `JWT_SECRET`, `NEXT_PUBLIC_QR_SECRET`

**AI** (dev only uses OpenAI; production uses Chomsky):

- `OPENAI_API_KEY` (local dev only)
- `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`

**Strategy**: Local dev uses OpenAI; production uses Chomsky LLM + OKTA + APIM.

---

## Key Gotchas

1. **Session Store Singleton**: `EnhancedSessionStore.getInstance()`. Call `clearAll()` in test `beforeEach`.

2. **Middleware files in `src/middleware/`**: These are NOT Next.js middleware. Actual implementation is `withRateLimit()` and `withCSRFProtection()` in `lib/api-security.ts`.

3. **Scripts use manual .env parsing**: No `dotenv` dependency. Scripts read `.env` directly.

4. **Real-time via Supabase**: Migrated from WebSocket to Supabase Realtime. No separate WS server needed.

5. **CSRF not used on API routes**: Bearer tokens are already CSRF-safe.

---

## Important Project Rules

- **No Mock Data**: Never generate dummy/mock data in production code
- **Type Check Before Push**: Always run `npm run type-check` before pushing
- **Chomsky LLM**: Keep `chomsky--0.17.9/` directory for production
- **Kluster.ai**: See `.cursor/rules/kluster-code-verify.mdc` for verification rules

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
