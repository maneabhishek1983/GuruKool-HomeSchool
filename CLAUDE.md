# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuruKool HomeSchool is a full-stack homeschooling management platform with:

- **Web Application**: Next.js 14 with App Router (parent/admin dashboards)
- **Mobile Application**: Flutter mobile app for teachers (QR check-in, session tracking)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI Features**: Agent-based architecture for autonomous code generation and analytics

**Node.js Version**: 20 (see [.nvmrc](.nvmrc))
**Package Manager**: npm (uses package-lock.json)

---

## Common Commands

### Web Application (Next.js)

**Development:**

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript compiler checks (**CRITICAL**: Run before every commit)
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

**Testing:**

- `npm test` - Run Jest unit tests
- `npm test -- <pattern>` - Run specific test file(s) (e.g., `npm test -- session`)
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:comprehensive` - Run comprehensive testing suite
- `npm run test:security` - Run security penetration tests

**Database:**

- `npm run verify:supabase` - Verify Supabase connection and schema
- `npm run verify:rls` - Verify Row Level Security policies
- `npm run db:push` - Push local migrations to Supabase
- `npm run db:status` - List migration status
- `node scripts/apply-migration-007.js` - Apply teacher_sessions → timesheet_entries sync trigger
- `node scripts/verify-sync-mechanism.js` - Verify sync trigger is working

### Mobile Application (Flutter)

**Setup:**

- `cd gurukool_teacher` - Navigate to Flutter project
- `flutter pub get` - Install Flutter dependencies
- `flutter doctor` - Check Flutter installation

**Development:**

- `flutter run -d chrome` - Run on Chrome (web)
- `flutter run -d windows` - Run on Windows desktop
- `flutter run` - Run on connected device/emulator
- Press `r` in terminal - Hot reload
- Press `R` in terminal - Hot restart
- Press `q` - Quit app

**Testing:**

- `flutter test` - Run unit tests
- `flutter test integration_test/` - Run integration tests
- `flutter analyze` - Run static analysis

**Build:**

- `flutter build apk` - Build Android APK
- `flutter build ios` - Build iOS (macOS only)
- `flutter build web` - Build for web deployment

---

## Architecture

### Tech Stack

**Web Application:**

- Framework: Next.js 14 with App Router
- Language: TypeScript (strict mode)
- UI: React 18, Tailwind CSS, Framer Motion, Mantine UI
- State: Zustand (session store), React Query (TanStack Query)
- Database: Supabase (PostgreSQL + Auth + Realtime)
- AI/ML: OpenAI API (dev only), Langchain, Pinecone
- Testing: Jest, Playwright, Testing Library, Storybook

**Mobile Application:**

- Framework: Flutter 3.x
- Language: Dart
- UI: Material Design 3
- State: Riverpod (providers + StateNotifier)
- Storage: Hive (offline-first), flutter_secure_storage
- Backend: Supabase (same as web)
- Testing: flutter_test, integration_test, mockito

### Key Directories

```
gurukool-homeschool/
├── src/                          # Next.js web application
│   ├── app/                      # App Router pages and API routes
│   │   ├── parent/              # Parent dashboard
│   │   ├── teacher/             # Teacher dashboard
│   │   ├── admin/               # Admin portal
│   │   └── api/                 # REST API endpoints
│   ├── components/              # React components
│   ├── services/                # Business logic services
│   │   ├── database.service.ts  # Supabase CRUD with parent isolation
│   │   ├── qr-auth.service.ts   # QR code authentication
│   │   └── teacher-qr.service.ts # Teacher QR management
│   ├── agents/                  # AI agent system (autonomous code generation)
│   │   ├── base.agent.ts       # Abstract base agent
│   │   ├── orchestrator.ts     # Agent coordination
│   │   └── registry.ts         # Agent discovery
│   ├── lib/                     # Core utilities
│   │   ├── supabase.ts         # Supabase client (client/server)
│   │   ├── validation.ts       # Zod schemas
│   │   └── api-security.ts     # Rate limiting, CSRF
│   ├── store/                   # Zustand state stores
│   └── design-system/           # Custom design tokens
│
├── gurukool_teacher/            # Flutter mobile application
│   ├── lib/
│   │   ├── config/
│   │   │   └── env.dart         # Environment configuration (dotenv)
│   │   ├── design_system/
│   │   │   └── tokens/          # Material Design 3 tokens
│   │   │       ├── colors.dart  # Color palette
│   │   │       ├── spacing.dart # Spacing scale
│   │   │       └── typography.dart # Typography system
│   │   ├── models/
│   │   │   └── flutter/         # Dart data models (mirrored from TypeScript)
│   │   ├── providers/           # Riverpod providers
│   │   │   ├── auth_provider.dart
│   │   │   ├── session_provider.dart
│   │   │   └── state/           # StateNotifier classes
│   │   ├── services/
│   │   │   ├── supabase.service.dart # Supabase client (PKCE auth)
│   │   │   ├── auth.service.dart     # Authentication
│   │   │   ├── hive_storage.service.dart # Offline storage
│   │   │   └── sync_queue.service.dart # Offline sync queue
│   │   ├── screens/             # Flutter screens/pages
│   │   └── main.dart            # App entry point
│   ├── integration_test/        # Integration tests
│   ├── test/                    # Unit tests
│   ├── .env                     # Environment variables (not in git)
│   ├── .env.example             # Template for .env
│   └── pubspec.yaml             # Flutter dependencies
│
├── supabase/
│   └── migrations/              # Database migrations (001-007)
│
├── scripts/                     # Utility scripts
│   ├── verify-supabase-connection.js
│   ├── apply-migration-007.js   # Sync trigger script
│   └── comprehensive-testing.js
│
└── agents/autonomous/           # Autonomous AI agents for code generation
    ├── orchestrator-agent.ts    # Sprint planning, task management
    ├── backend-integration-agent.ts # Supabase, auth, data models
    ├── ui-designer-agent.ts     # Screens, design tokens
    └── state-management-agent.ts # Providers, state classes
```

### AI Agent System (Autonomous Code Generation)

The project uses autonomous AI agents to generate production-ready code:

**Web Application Agents** (`src/agents/`):

- `base.agent.ts` - Abstract base class with health checks and metrics
- `orchestrator.ts` - Coordinates multiple agents with priority execution
- `registry.ts` - Dynamic agent registration and discovery
- Specialized agents: auth-verification, analytics, task-automation, communication, security-analysis

**Mobile Application Agents** (`agents/autonomous/`):

- `orchestrator-agent.ts` - Sprint planning, task breakdown (Priority 10)
- `backend-integration-agent.ts` - Generates Supabase services, data models (Priority 9)
- `qr-scanner-specialist-agent.ts` - Native QR scanner implementation (Priority 8)
- `ui-designer-agent.ts` - Generates screens with Material Design 3 (Priority 8)
- `state-management-agent.ts` - Generates Riverpod providers (Priority 7)
- `testing-qa-agent.ts` - Generates unit/integration tests (Priority 6)

**How to Use Agents:**

```bash
# Web app agents (interactive)
# Use through conversation - agents execute automatically

# Mobile app agents (batch execution)
cd agents/autonomous
npx tsx orchestrator-agent.ts  # Runs all agents in priority order
```

See [AGENT_IMPLEMENTATION_STATUS.md](AGENT_IMPLEMENTATION_STATUS.md) for complete agent documentation.

### Flutter Mobile App Architecture

**Purpose**: Teacher-focused mobile app for QR check-in/out and session tracking

**Key Features:**

- QR code scanner for student authentication
- Session check-in/check-out with location tracking
- Offline-first architecture (Hive storage)
- Real-time sync with Supabase
- Material Design 3 UI matching web app design tokens

**State Management Pattern:**

```dart
// Riverpod Provider + StateNotifier
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});

// State class (immutable)
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  // ...
}

// StateNotifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState.initial());

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true);
    // ... authentication logic
  }
}
```

**Offline Support:**

- Hive databases: `sessions`, `settings`
- Sync queue for network failures
- Automatic sync when connection restored
- Cache service with configurable TTL

**Environment Configuration:**

```dart
// gurukool_teacher/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
QR_SECRET=your-qr-secret
API_BASE_URL=http://localhost:3000/api  # or production URL

// Load with flutter_dotenv
import 'package:flutter_dotenv/flutter_dotenv.dart';
await dotenv.load(fileName: ".env");
final supabaseUrl = dotenv.env['SUPABASE_URL']!;
```

### Authentication System

**Multi-layered authentication:**

1. **Web App (Next.js)**:
   - Supabase Auth with Bearer tokens
   - API routes use `Authorization` header → `supabase.auth.getUser()`
   - RLS policies enforce parent isolation
   - QR codes signed with HMAC-SHA256 (32-byte secret)

2. **Mobile App (Flutter)**:
   - Supabase Auth with PKCE flow (OAuth 2.0)
   - JWT token stored in flutter_secure_storage
   - Auto-refresh on token expiry
   - QR scanner validates signatures before check-in

3. **QR Code Flow**:
   - Parent generates student-specific QR code (web app)
   - Teacher scans QR code (mobile app)
   - Mobile app validates signature + creates session
   - Session syncs to Supabase → appears in parent dashboard

### Database Schema

**Key Tables:**

- `users` - User accounts (parent/teacher/admin)
- `students` - Student profiles with academic standards
- `teachers` - Teacher profiles with qualifications
- `teacher_qr_codes` - Student-specific QR codes for teachers
- `teacher_sessions` - Session logs (check-in/out)
- `timesheet_entries` - Legacy timesheet data
- `sessions` - Teaching sessions (older table)

**Critical Migration:**

- Migration 007: Sync trigger `teacher_sessions` → `timesheet_entries`
- Ensures parent dashboard shows sessions from both tables
- Run: `node scripts/apply-migration-007.js`

---

## Code Patterns

### TypeScript (Web App)

**Type Safety:**

- All types centralized in `src/types/index.ts`
- Import from `@/types` (never relative paths)
- Use Zod schemas from `@/lib/validation.ts` for API validation

**API Route Pattern:**

```typescript
// src/app/api/students/route.ts
import { withRateLimit } from '@/lib/api-security';
import { studentCreateSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withRateLimit({
  keyPrefix: 'api:students:create',
  max: 20,
})(async (request: NextRequest) => {
  // 1. Authenticate
  const authHeader = request.headers.get('authorization');
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 2. Validate input
  const body = await request.json();
  const validation = studentCreateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(createValidationErrorResponse(validation.error), {
      status: 400,
    });
  }

  // 3. Business logic with parent isolation
  const student = await DatabaseService.createStudent(validation.data, user.id);

  return NextResponse.json({ data: student }, { status: 201 });
});
```

**Database Operations:**

```typescript
// Always use DatabaseService for CRUD (enforces parent isolation)
import { DatabaseService } from '@/services/database.service';

// Get parent's students
const students = await DatabaseService.getStudents(parentId);

// Create student (auto-assigns to parent)
const student = await DatabaseService.createStudent(data, parentId);

// Update student (validates parent ownership)
await DatabaseService.updateStudent(id, data, parentId);
```

### Dart (Mobile App)

**Service Pattern:**

```dart
// lib/services/session_api.service.dart
class SessionApiService {
  final SupabaseClient _supabase;
  final String _apiBaseUrl;

  SessionApiService(this._supabase, this._apiBaseUrl);

  Future<Session> checkIn({
    required String teacherId,
    required String studentId,
    required LatLng location,
  }) async {
    final token = _supabase.auth.currentSession?.accessToken;

    final response = await http.post(
      Uri.parse('$_apiBaseUrl/teacher-sessions'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'teacher_id': teacherId,
        'student_id': studentId,
        'location': '${location.latitude},${location.longitude}',
      }),
    );

    if (response.statusCode != 201) {
      throw ApiException('Check-in failed', response.statusCode);
    }

    return Session.fromJson(jsonDecode(response.body));
  }
}
```

**Provider Usage:**

```dart
// In a Widget
class SessionScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionProvider);

    return sessionState.when(
      loading: () => CircularProgressIndicator(),
      error: (error) => Text('Error: $error'),
      data: (session) => SessionCard(session: session),
    );
  }
}

// Trigger state change
ref.read(sessionProvider.notifier).checkIn(teacherId, studentId);
```

---

## Production Deployment

### Web Application (Vercel)

**Platform:** Vercel (preferred for Next.js 14)

**Environment Variables:**

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only

# Security (Required)
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_QR_SECRET=your-32-byte-base64-secret

# AI/ML (Development only)
OPENAI_API_KEY=your-openai-key  # Local dev only
PINECONE_API_KEY=your-pinecone-key

# Redis (Production)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Demo Credentials (Dev/Staging only)
ENABLE_DEMO_CREDENTIALS=false  # Must be false in production
```

**Deployment Workflow:**

1. Push to GitHub → Vercel build triggered
2. Preview deployments for all branches
3. Production deployment on merge to `main`
4. **CRITICAL**: Run `npm run type-check` locally before pushing

### Mobile Application

**Android:**

```bash
cd gurukool_teacher
flutter build apk --release
# APK: build/app/outputs/flutter-apk/app-release.apk
```

**iOS (macOS only):**

```bash
flutter build ios --release
# Open Xcode to publish to App Store
```

**Web (Flutter Web):**

```bash
flutter build web
# Output: build/web/ (deploy to Vercel/Firebase Hosting)
```

**Environment Configuration:**

- Copy `.env.example` to `.env`
- Add production Supabase credentials
- Never commit `.env` to git

---

## Testing Strategy

### Web Application

**Unit Tests (Jest):**

```bash
npm test                    # All tests
npm test -- session.store   # Specific file
npm run test:coverage       # Coverage report
```

**E2E Tests (Playwright):**

```bash
npm run test:e2e            # Headless
npm run test:e2e:ui         # With UI
npm run test:e2e:debug      # Debug mode
```

**Security Tests:**

```bash
npm run test:security       # Penetration tests
npm run verify:rls          # RLS policies
```

### Mobile Application

**Unit Tests:**

```bash
cd gurukool_teacher
flutter test                # All tests
flutter test test/unit/     # Unit tests only
```

**Integration Tests:**

```bash
flutter test integration_test/
flutter test integration_test/auth_flow_test.dart  # Specific test
```

**Widget Tests:**

```bash
flutter test test/widget/
```

**Coverage:**

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

---

## Important Notes & Gotchas

### Critical Architecture Issues

**⚠️ Data Fragmentation (PARTIALLY FIXED)**:

- Migration 007 syncs `teacher_sessions` → `timesheet_entries` via database trigger
- Parent dashboard may still need updates to query both tables
- See [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md) for details

**⚠️ QRScanner Component Duplication**:

- THREE `QRScanner` components exist with different capabilities
- Production scanner: `src/components/shared/QRScanner.tsx` (html5-qrcode)
- Mock scanner: `src/components/auth/QRScanner.tsx` (simulation)
- Manual entry: `src/components/QRScanner.tsx` (no scanning)

### Key Architectural Decisions

**Authentication Flow:**

- Web: Bearer token authentication (not cookies)
- Mobile: PKCE flow with JWT stored in secure storage
- Do NOT use `withCSRFProtection()` on API routes (Bearer tokens are CSRF-safe)

**Rate Limiting:**

- Current: In-memory Map (loses state on restart)
- Limitation: Doesn't work across Vercel serverless instances
- TODO: Migrate to Redis (Upstash) for production

**Supabase Client Configuration:**

- `src/lib/supabase.ts` exports:
  - `supabase` - Client-side (anon key, RLS-protected)
  - `getSupabaseAdmin()` - Server-side (service role, bypasses RLS)
- Never import service role key in client components

**Real-Time Communication:**

- Migrated from WebSocket to Supabase Realtime
- Connection: `wss://*.supabase.co`
- No separate WebSocket server needed

**Environment Variables (Scripts):**

- Verification scripts in `scripts/` use manual .env parsing
- No `dotenv` dependency (avoids production bloat)
- Scripts read `.env` file directly using `fs.readFileSync()`

### Flutter-Specific Gotchas

**Platform-Specific Code:**

- QR scanner requires camera permissions (different per platform)
- Location services need platform-specific configuration
- iOS requires Info.plist entries for camera/location

**Offline Sync:**

- Hive stores data locally
- Sync queue retries failed API calls
- Always check network status before API calls

**State Management:**

- Use `ref.watch()` to rebuild on state changes
- Use `ref.read()` for one-time reads or callbacks
- StateNotifier state must be immutable (use `copyWith()`)

**Design Tokens:**

- Flutter design tokens mirror Tailwind CSS tokens from web app
- Keep `design_system/tokens/` in sync across web and mobile
- Use semantic color names (e.g., `AppColors.primary`) not raw hex values

---

## Kluster.ai Code Verification

This project uses Kluster.ai for automated code quality and security verification.

### Automatic Verification

**When it runs:**

- After ANY code modification or file creation
- After ANY file changes (all file types, not just code)

**What it does:**

- Checks for security issues, bugs, and code quality problems
- Returns prioritized issue list (P0-P5)
- Provides `agent_todo_list` for fixes

**Important:**

- ALWAYS announce issues found BEFORE making changes (never fix silently)
- Follow `agent_todo_list` in exact order
- Complete all fixes before running verification again

### Manual Verification

**Trigger phrases:**

- "verify with kluster"
- "verify this file"
- "check for bugs"
- "check security"

### Session Management (CRITICAL)

**First kluster call:** Do NOT include `chat_id` field

**Subsequent calls:** MANDATORY - Always include `chat_id` with exact value from previous kluster response

**Why:** Missing `chat_id` creates isolated sessions instead of maintaining context

### Dependency Checks

Automatically runs before:

- Package installation (npm install, flutter pub add)
- Updating package.json or pubspec.yaml
- Adding new libraries/frameworks

### End-of-Conversation Summary

At the end of ANY conversation where kluster tools were used, ALWAYS provide:

**🔍 kluster.ai Review Summary:**

- **📋 kluster feedback**: Summarize ALL issues found across all kluster calls (grouped by severity)
- **✅ Issues found and fixed**: Document what changes were applied
- **⚠️ Impact Assessment**: What would have happened without these fixes

---

## Project-Specific Rules (from .claude/CLAUDE.md)

**Data Handling:**

- Never generate dummy/mock data in production code
- Always use real data from Supabase

**Environment Separation:**

- **Development**: Use OpenAI API key for local LLM testing
- **Production**: Use Chomsky LLM, OKTA, APIM (when integrated)

**Chomsky Directory:**

- Always keep `chomsky--0.17.9/` directory
- Used for production LLM integration

**Database Migrations:**

- Apply via Supabase Dashboard only (no CLI)
- Migrations in `supabase/migrations/` (001-007)
- Apply in sequence
- See [QUICK_START_MIGRATIONS.md](QUICK_START_MIGRATIONS.md)

**TypeScript Quality Gates:**

- ALWAYS run `npm run type-check` before committing
- 0 TypeScript errors required for deployment
- Vercel builds fail on type errors

**Testing Before Deployment:**

- Never commit test HTML files with hardcoded API keys
- Always use environment variables for credentials

---

## Academic Standards Support

**Supported Educational Systems:**

- **UK**: Year-based (Foundation to Year 13), National Curriculum
- **US**: Grade-based (Pre-K to Grade 12), Common Core
- **India**: Class-based (Nursery to Class 12), CBSE/ICSE

Each system has country-specific subjects, assessment methods, and learning outcomes.

See `src/services/academic-standards.service.ts` for implementation.

---

## Quick Reference Links

**Architecture & Planning:**

- [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md) - Critical architecture issues
- [FLUTTER_DEVELOPMENT_PLAN.md](FLUTTER_DEVELOPMENT_PLAN.md) - 6-week mobile app roadmap
- [AGENT_IMPLEMENTATION_STATUS.md](AGENT_IMPLEMENTATION_STATUS.md) - Agent usage guide

**Setup & Deployment:**

- [README.md](README.md) - Complete setup guide
- [QUICK_START_MIGRATIONS.md](QUICK_START_MIGRATIONS.md) - Database migration steps
- [VERCEL_ENV_VARS.txt](VERCEL_ENV_VARS.txt) - Production environment variables

**API & Testing:**

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [QA_TEST_REPORT.md](QA_TEST_REPORT.md) - Test coverage report
- [TESTING_FRAMEWORK.md](TESTING_FRAMEWORK.md) - Testing strategy

**Flutter Mobile App:**

- [FLUTTER_APP_SUCCESS.md](FLUTTER_APP_SUCCESS.md) - Mobile app status
- [FLUTTER_INITIALIZATION_GUIDE.md](FLUTTER_INITIALIZATION_GUIDE.md) - Setup guide
- `gurukool_teacher/README_TESTING.md` - Flutter testing guide
