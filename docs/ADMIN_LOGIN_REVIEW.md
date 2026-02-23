# Comprehensive Codebase Review Report

**Date:** 2026-02-23
**Reviewer:** Claude Code (Automated Full Codebase Audit)
**Branch:** `claude/review-admin-login-RG1eh`
**Scope:** Full codebase security, architecture, and quality audit (~200+ source files, 40+ API routes, 20+ migrations, 30+ services, 80+ components)

---

## Executive Summary

This report covers a full review of the GuruKool HomeSchool codebase across 7 dimensions: API security, authentication/authorization, services layer, database migrations, type system, component quality, and configuration. The review identified **85+ issues** ranging from critical security vulnerabilities to minor code quality gaps.

### Severity Distribution

| Severity | Count | Description                                              |
| -------- | ----- | -------------------------------------------------------- |
| CRITICAL | 12    | Security vulnerabilities, data exposure, auth bypass     |
| HIGH     | 18    | Data isolation failures, memory leaks, race conditions   |
| MEDIUM   | 30    | Missing validation, inconsistent patterns, accessibility |
| LOW      | 25+   | Code quality, documentation, minor improvements          |

---

## 1. CRITICAL SECURITY VULNERABILITIES

### 1.1 Missing Authentication on 8+ API Routes

**Risk: Unauthorized data access**

The following API routes lack proper authentication, allowing any caller to access sensitive data:

| Route                          | Issue                                                 |
| ------------------------------ | ----------------------------------------------------- |
| `/api/qr/generate`             | Generates QR codes without verifying teacher identity |
| `/api/qr/validate`             | Validates QR codes without auth                       |
| `/api/teacher-sessions/parent` | Uses admin client, accepts any `parentId` query param |
| `/api/teacher-sessions/active` | Uses admin client, accepts any `userId` query param   |
| `/api/parent/dashboard`        | Uses admin client, accepts any `parentId` param       |
| `/api/data-sheets/entries`     | No bearer token auth                                  |
| `/api/data-sheets/student`     | No bearer token auth                                  |
| `/api/teacher/dashboard`       | Uses admin client without auth                        |

**Impact:** Attackers can enumerate parent/student IDs and access dashboards, session data, and timesheets belonging to other families.

**Fix:** Add `requireTeacher()`, `requireParent()`, or `requireParentOrAdmin()` middleware from `src/lib/auth-middleware.ts` to every route.

---

### 1.2 Biometric Verification Not Implemented

**File:** `src/app/api/biometric/verify/route.ts`

```typescript
// TODO: Implement proper WebAuthn signature verification
// For now, we'll accept the signature as valid if the credential exists
```

The endpoint accepts any biometric signature as valid if the credential record exists. Biometric authentication can be completely bypassed by sending any non-empty `signature`, `authenticatorData`, and `clientDataJSON` values.

---

### 1.3 CSRF Token Generation Uses Weak Fallback

**File:** `src/lib/csrf.ts` (Lines 9-15)

```typescript
const token =
  globalThis.crypto?.randomUUID?.() || `${Math.random()}-${Date.now()}`;
```

The fallback uses `Math.random()` which is cryptographically predictable. CSRF tokens can be forged in environments where `crypto.randomUUID` is unavailable.

---

### 1.4 CSRF Token Validation is Direct String Comparison

**File:** `src/lib/csrf.ts` (Lines 20-49)

The token is Base64-encoded JSON with no HMAC signature. Validation is just `token === cookieToken`. This defeats the double-submit cookie pattern since anyone who can read the cookie can forge the token.

---

### 1.5 Security Service Uses Base64, Not Encryption

**File:** `src/services/security.service.ts` (Line 207)

```typescript
const encrypted = Buffer.from(data).toString('base64');
```

The "encryption" method is just Base64 encoding. Data marked as "encrypted" is plaintext when decoded.

---

### 1.6 Hardcoded Fallback Secrets

Multiple services fall back to hardcoded secrets when environment variables are missing:

| File                                | Fallback                        |
| ----------------------------------- | ------------------------------- |
| `services/teacher-qr.service.ts:82` | `'default-secret'` for QR HMAC  |
| `services/token.service.ts:16`      | `'fallback-secret-key'` for JWT |
| `lib/supabase.ts:5-8`               | `'your-anon-key'` for Supabase  |

**Impact:** If environment variables are misconfigured, QR codes and JWTs are signed with known, guessable secrets.

---

### 1.7 Cron Endpoint Auth Skipped When Secret Missing

**File:** `src/app/api/cron/qr-refresh/route.ts` (Lines 28-31)

```typescript
if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) { ... }
```

If `CRON_SECRET` is undefined, the entire authorization check is skipped - the cron endpoint becomes public.

---

### 1.8 CSP Headers Too Permissive

**Files:** `next.config.mjs:38`, `src/middleware/security-headers.ts:52-65`

```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net
```

Both `'unsafe-eval'` and `'unsafe-inline'` negate CSP protection against XSS. `cdn.jsdelivr.net` allows loading arbitrary npm packages.

---

### 1.9 Demo Credentials in Production Code

**Files:** `src/lib/env.ts`, `src/components/auth/FallbackAuth.tsx`

- Environment schema accepts `DEMO_PARENT_PASSWORD`, `DEMO_ADMIN_PASSWORD`, `DEMO_TEACHER_PASSWORD`
- FallbackAuth component contains hardcoded demo credentials (`teacher@example.com`, SMS code `123456`, backup code `BACKUP123`)

---

### 1.10 RLS Policy Bug in Biometric Tables

**File:** `supabase/migrations/015_biometric_geofencing.sql` (Lines 200-214, 234-236)

```sql
-- teacher_biometric_credentials RLS:
USING (auth.uid() = teacher_id)
```

But `teacher_id` references `teachers(id)`, not `users(id)`. This policy will **never match** and effectively blocks all legitimate teacher access to their own biometric credentials. Same bug on `location_verification_log`.

**Correct pattern** (used in migration 018 for `face_verification_audit`):

```sql
USING (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()))
```

---

### 1.11 Parent Data Isolation Failures in Database Service

**File:** `src/services/database.service.ts`

`updateStudent()` and `deleteStudent()` don't verify the student belongs to the requesting parent:

```typescript
static async updateStudent(studentId: string, updates) {
  // MISSING: .eq('parent_id', parentId)
  const { data } = await supabase.from('students').update(dbUpdates).eq('id', studentId);
}
```

If RLS is ever bypassed (admin client, service role), any student can be modified by any authenticated user.

---

### 1.12 Invitation Token Logged to Console

**File:** `src/app/api/invitations/send/route.ts` (Lines 129-133)

```typescript
console.log('Teacher Invitation Created:');
console.log('  Invitation URL:', invitationUrl);
```

Invitation URLs containing security tokens are written to production logs.

---

## 2. HIGH-PRIORITY ISSUES

### 2.1 Memory Leaks in Singleton Services

| Service                       | Issue                                                   |
| ----------------------------- | ------------------------------------------------------- |
| `qr-auth.service.ts:12`       | In-memory `Map<string, QRToken>` grows indefinitely     |
| `webauthn.service.ts:331`     | `challengeStore` Map never fully cleaned                |
| `security.service.ts:130-135` | Rate limit + login attempt Maps have no cleanup         |
| `api-security.ts:52-56`       | `routeRateLimitStore` Map has no periodic purge         |
| `session.store.ts:34-35`      | `aiInsightsCache` and `learningPatternsCache` unbounded |

**Impact:** Long-running production instances will gradually consume all available memory.

---

### 2.2 Race Conditions

| Location                             | Issue                                              |
| ------------------------------------ | -------------------------------------------------- |
| `sync-manager.service.ts:131`        | `isSyncing` check-then-set is not atomic           |
| `offline-storage.service.ts:337-384` | GET-then-PUT IndexedDB updates not transactional   |
| `session.service.ts:313-315`         | Expired sessions accessible between cleanup cycles |
| `api-security.ts:111-137`            | Rate limit check-then-increment can be raced       |
| Migration 007 trigger                | SELECT-then-INSERT without `ON CONFLICT`           |

---

### 2.3 Network Manager Event Listener Leak

**File:** `src/services/network-manager.service.ts` (Lines 75-76, 551-552)

```typescript
window.addEventListener('online', this.handleOnline.bind(this)); // Creates function A
window.removeEventListener('online', this.handleOnline.bind(this)); // Creates function B (different!)
```

`.bind()` creates a new function each time, so `removeEventListener` never removes the original listener. Listeners accumulate on every cleanup/restart cycle.

---

### 2.4 Incomplete Sync Manager

**File:** `src/services/sync-manager.service.ts`

Core CRUD operations are not implemented:

- Line 264: `TODO: Implement createSession method in databaseService`
- Line 317: `TODO: Implement getSessionById or use listUpcomingSessions`
- Line 344: `TODO: Implement updateSession method in databaseService`
- Lines 386-391: Session/user delete operations return `false`

Session sync fails silently. Offline data is never persisted.

---

### 2.5 Duplicate Session Store Implementations

Two conflicting stores exist:

- `src/store/session.store.ts` (1007 lines) - Complex singleton with caching
- `src/store/sessionStore.ts` (98 lines) - React hook with localStorage

They define incompatible `SessionRecord` interfaces and manage overlapping state.

---

### 2.6 78 TypeScript Errors

`npm run type-check` reveals 78 errors including:

- Object possibly undefined in test files
- Missing properties on AgentContext type
- Mock types incompatible with expected signatures
- `exactOptionalPropertyTypes` violations

---

### 2.7 Duplicate Migration Numbering

| Number | Files                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------- |
| 002    | `002_data_sheets_and_extended_features.sql`, `002_timesheet_tables.sql`, `002_timesheet_tables_safe.sql` |
| 007    | `007_sync_teacher_sessions_to_timesheet.sql`, `007_update_teacher_sessions_for_timesheet.sql`            |

Execution order is ambiguous. Database schema may be inconsistent depending on which ran first.

---

### 2.8 Foreign Key Architecture Confusion

- `timesheet_entries.teacher_id` references `users(id)`
- `teacher_sessions.teacher_id` references `teachers(id)`
- Migration 013 adds complex trigger logic to bridge this mismatch
- `parent_qr_codes` and `teacher_qr_codes` are separate systems treated as interchangeable
- `teachers.user_id` is nullable (migration 008), creating ambiguity about when to use `users` vs `teachers`

---

## 3. MEDIUM-PRIORITY ISSUES

### 3.1 API Pattern Inconsistencies

Routes use 4 different auth approaches:

1. `withRateLimit` + `requireTeacher` wrapper
2. Manual authorization header extraction
3. `withRedisRateLimit` + `requireTeacherOrAdmin`
4. Admin client with no auth

This inconsistency makes security auditing difficult and error-prone.

---

### 3.2 Rate Limiting Gaps

These information-disclosure endpoints lack rate limiting:

- `/api/teacher-sessions/parent`
- `/api/teacher-sessions/active`
- `/api/parent/dashboard`
- `/api/data-sheets/entries` (GET)
- `/api/data-sheets/student`
- `/api/teacher/dashboard`

---

### 3.3 Duplicate Validation Schemas

Nearly identical Zod schemas exist in both:

- `src/lib/validation.ts`
- `src/lib/validators/api-schemas.ts`

Duplicated schemas: `contactAdminSchema`, `createStudentSchema`, `createSessionSchema`, `paginationSchema`. Changes must be made in two places.

---

### 3.4 Type System Inconsistencies

| Issue                  | Details                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| SessionStatus mismatch | App defines 5 values (`scheduled`, `in-progress`, `completed`, `cancelled`, `rescheduled`), DB schema has 4 (missing `rescheduled`) |
| Country codes          | `'India'` vs `'IN'` vs `'INDIA'` across `types/index.ts`, `types/supabase.ts`, `types/syllabus.types.ts`                            |
| Missing Supabase types | `student_face_records` and `face_verification_audit` tables not in `types/supabase.ts`                                              |
| `any` usage            | 10+ fields use `any` type in type definitions, defeating strict mode                                                                |

---

### 3.5 Missing Database Indexes

No composite indexes for common queries:

- `student_id + parent_id` on students, data_sheets
- `teacher_id + student_id` on teacher_assignments, teacher_sessions
- `status + created_at` on sessions for filtering
- No partial indexes for `WHERE is_active = true` on QR tables

---

### 3.6 Middleware Performance

**File:** `middleware.ts`

- Rate limiting applied twice (Redis + in-memory) sequentially on every request
- Database query (`SELECT role FROM users`) executed on every protected route with no caching
- No CORS middleware for API routes

---

### 3.7 Mock Data in Production Code

**File:** `src/store/session.store.ts` (Lines 477-591)

Contains hardcoded sample data (`student-1`, `teacher-1`, `parent-1`). Violates the project rule: "No Mock Data: Never generate dummy/mock data in production code."

---

### 3.8 Accessibility Gaps

| Issue                                                           | Location                                        |
| --------------------------------------------------------------- | ----------------------------------------------- |
| Modals missing `role="dialog"`, `aria-modal`, `aria-labelledby` | `TeacherQRCodes.tsx:341`                        |
| Color-only status indicators (red/yellow/green dots)            | `FaceScanner.tsx:363`, `TeacherQRCodes.tsx:287` |
| Emoji characters without semantic alternatives                  | `FaceEnrollment.tsx`                            |
| Generic alt text (`"QR Code"`)                                  | `TeacherQRCodes.tsx:495`                        |
| Missing ARIA labels on context-dependent buttons                | Multiple components                             |

---

### 3.9 Missing Error Boundaries

No Error Boundary components wrap critical sections:

- Dashboard pages (parent, teacher, admin)
- Face recognition feature trees
- Modal/drawer content

Detection errors in `FaceScanner.tsx:256` are logged but never reported to `onError` callback.

---

### 3.10 Incomplete RLS Policies

- Conversation/message RLS doesn't validate parent owns students in conversation
- Teacher assignment doesn't fully isolate students across parents
- No audit logging when admins access parent-specific data
- Teacher invitation UPDATE policy doesn't verify the invitation is for the correct teacher

---

### 3.11 Dual Timesheet Systems

Both `timesheet_entries` and `teacher_sessions` tables track similar data, synced via a fragile trigger. The trigger (migration 007/013) has complex logic to resolve FK mismatches between `users.id` and `teachers.id`.

---

### 3.12 Face Descriptor Validation Too Permissive

**File:** `src/lib/face-matching.ts` (Lines 224-232)

Comment says descriptors should be in range [-1, 1] but code allows [-10, 10] - a 10x tolerance that could allow malformed descriptors.

---

### 3.13 Auth Middleware Null Email

**File:** `src/lib/auth-middleware.ts` (Line 132)

```typescript
email: authUser.email!,  // Non-null assertion - Supabase CAN return null email
```

---

### 3.14 CORS Allows Localhost in Production

**File:** `src/middleware/security-headers.ts` (Lines 137-144)

Hardcoded `http://localhost:3000` in allowed origins array used in all environments.

---

## 4. LOW-PRIORITY ISSUES

### 4.1 Configuration Gaps

- `.env.local` has only 4 of 55+ required variables
- `face-api.js` is an archived/unmaintained library
- PWA config caches Supabase API responses for 24h (stale auth data risk)
- Jest test timeout set to 15s (may be excessive for CI)

### 4.2 Code Quality

- Debug `console.log` statements left in production components (`TeacherQRCodes.tsx:109`)
- Invitation service lacks rollback for partial transaction failures (orphaned auth users)
- Analytics service methods return empty arrays (unimplemented stubs)
- Random progress data in API: `Math.floor(Math.random() * 20) + 80` (`teacher/dashboard/route.ts:254`)
- 60+ markdown documentation files - many outdated or overlapping
- Missing face validation Zod schemas in `api-schemas.ts`
- Password schema allows no special characters and no maximum length

### 4.3 Missing Constraints

- No unique constraint on `(parent_id, email)` for students
- No temporal constraint ensuring `session_end > session_start` in all session tables
- Multiple pending invitations possible for same teacher/email
- JSONB fields (`preferences`, `location`, `materials`, `objectives`) have no schema validation
- Nullable `user_id` on teachers creates ambiguous records

---

## 5. REMEDIATION PLAN

### Phase 1: Critical Security (Immediate)

1. **Add authentication** to all 8 unprotected API routes
2. **Implement biometric verification** in `/api/biometric/verify` (proper WebAuthn signature check)
3. **Fix CSRF** - use `crypto.getRandomValues()` exclusively; add HMAC signatures to tokens
4. **Replace Base64** with actual AES-256-GCM in `security.service.ts`
5. **Remove hardcoded secrets** - fail explicitly when env vars are missing
6. **Fix cron auth** - require `CRON_SECRET` unconditionally
7. **Fix RLS policies** in migration 015 for `teacher_biometric_credentials` and `location_verification_log`
8. **Add `parent_id` checks** to `updateStudent()` and `deleteStudent()` in `database.service.ts`
9. **Remove demo credentials** from production code paths
10. **Remove invitation token logging** from `invitations/send/route.ts`

### Phase 2: High Priority

11. **Add cleanup intervals** to all in-memory Maps (rate limit stores, QR tokens, caches)
12. **Fix race conditions** - add mutex/lock to sync manager; use atomic DB operations
13. **Fix event listener leak** in `network-manager.service.ts` - store bound function references
14. **Implement missing sync CRUD** operations in `sync-manager.service.ts`
15. **Consolidate session stores** into single implementation
16. **Fix 78 TypeScript errors** (run `npm run type-check`)
17. **Resolve duplicate migrations** - choose canonical versions, document decisions
18. **Standardize auth middleware** patterns across all routes

### Phase 3: Medium Priority

19. **Add rate limiting** to all information-disclosure endpoints
20. **Consolidate validation schemas** into single source of truth
21. **Fix type inconsistencies** (SessionStatus, CountryCode, missing Supabase types)
22. **Add composite database indexes** for common queries
23. **Add middleware caching** for user role lookups
24. **Remove mock data** from production store
25. **Add Error Boundary components** to all page trees
26. **Implement accessibility fixes** (ARIA labels, text alternatives, modal attributes)
27. **Remove `unsafe-eval`/`unsafe-inline`** from CSP headers

### Phase 4: Technical Debt

28. **Resolve dual timesheet system** architecture
29. **Normalize user/teacher FK** confusion (standardize whether `teacher_id` means `users.id` or `teachers.id`)
30. **Evaluate replacing** unmaintained `face-api.js` with actively maintained alternative
31. **Implement Redis-based rate limiting** for production
32. **Add audit trail** for sensitive operations (face verification, admin access, data mutations)
33. **Implement secret rotation** for encryption keys
34. **Clean up documentation** - consolidate 60+ markdown files into organized set

---

## 6. FILES WITH MOST ISSUES

| File                                               | Issues                                          | Severity |
| -------------------------------------------------- | ----------------------------------------------- | -------- |
| `src/lib/csrf.ts`                                  | Weak generation, no HMAC                        | CRITICAL |
| `src/services/security.service.ts`                 | Fake encryption, no cleanup                     | CRITICAL |
| `src/services/database.service.ts`                 | Missing parent isolation on mutations           | CRITICAL |
| `src/app/api/biometric/verify/route.ts`            | No actual signature verification                | CRITICAL |
| `src/lib/api-security.ts`                          | Memory leak, race condition                     | HIGH     |
| `src/services/sync-manager.service.ts`             | Race condition, 3 unimplemented methods         | HIGH     |
| `src/services/network-manager.service.ts`          | Event listener leak                             | HIGH     |
| `src/store/session.store.ts`                       | Unbounded cache, mock data in production        | HIGH     |
| `supabase/migrations/015_biometric_geofencing.sql` | RLS policy bugs on 2 tables                     | HIGH     |
| `middleware.ts`                                    | Double rate limiting, DB query on every request | MEDIUM   |
| `src/types/index.ts`                               | `any` types, inconsistent enums                 | MEDIUM   |
| `src/types/supabase.ts`                            | Missing table type definitions                  | MEDIUM   |

---

## 7. POSITIVE FINDINGS

Despite the issues above, the codebase demonstrates strong patterns in several areas:

1. **Face encryption** (`lib/face-encryption.ts`) - AES-256-GCM with proper IV handling and auth tags
2. **Server-side face matching** (`lib/face-matching.ts`) - Client never sees confidence scores
3. **Zod validation** - Most routes properly validate input with comprehensive schemas
4. **Rate limiting framework** - Good structure with both in-memory and Redis options
5. **QR code security** - HMAC-SHA256 signatures with daily rotation and 5-minute expiry
6. **Supabase Realtime** - Proper subscription cleanup in components
7. **Camera handling** (`FaceScanner.tsx`) - Good fallbacks for mobile browsers, timeouts, and constraints
8. **Design system** - Well-organized token-based theming with comprehensive component library
9. **Academic standards** - Complete UK/US/India educational system coverage
10. **PWA support** - Service worker, offline storage, and sync manager architecture

---

## 8. PREVIOUS ADMIN LOGIN REVIEW FINDINGS (2026-01-28)

The following issues from the previous admin login review remain relevant:

- Hardcoded temporary password `'temporary-password-123'` in `authContext.tsx:341`
- No CAPTCHA protection for login attempts
- Client-side password minimum (6 chars) inconsistent with server-side (8 chars)
- `getAllUsers()` deprecated but still exposed in context
- Console logging of login attempts includes email addresses
- Client-side only route protection for admin pages

---

_Review covers ~200+ source files, 40+ API routes, 20+ database migrations, 30+ services, and 80+ components._
