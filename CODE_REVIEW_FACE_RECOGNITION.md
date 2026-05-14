# Code Review — Face Recognition Feature Batch

**Scope:** Recent commits on `main` from `bfd1638` through `c0e8e31` (HEAD)
**Range:** ~11 commits, 53 files, +11,523/-2,573 lines
**Reviewer:** Deep audit across security, performance, correctness, maintainability
**Date:** 2026-05-10

---

## Summary ratings

| Dimension       | Rating | Notes                                                                                       |
| --------------- | ------ | ------------------------------------------------------------------------------------------- |
| Security        | 🔴 D   | One critical bypass, one critical credential leak (out of band), several high-severity gaps |
| Performance     | 🟡 B-  | Mostly fine; rate-limit path is chatty and fails open                                       |
| Correctness     | 🔴 D+  | Migration has a constraint bug that breaks 3rd enrollment                                   |
| Maintainability | 🟢 B+  | Clear structure, thorough tests on crypto, generous JSDoc                                   |

---

## 🚨 Critical (must-fix before merge to production)

### C1 — Exposed GitHub PAT in `.git/config`

This is out of scope of the diff, but discovered while running `git remote -v`. The origin URL has a `ghp_…` token embedded. **Rotate immediately** at github.com/settings/tokens, revoke the old token, then:

```bash
git remote set-url origin https://github.com/maneabhishek1983/GuruKool-HomeSchool.git
git config --global credential.helper store   # or use GitHub CLI / SSH instead
```

Treat that token as fully compromised — assume it has been read by anything with access to your filesystem.

### C2 — `verificationConfidence` is client-controlled and stored as if server-calculated

**File:** `src/app/api/teacher-sessions/check-in-face/route.ts:18, 152`
**Companion:** `src/components/teacher/FaceCheckIn.tsx:226`

The architecture intent (per `CLAUDE.md` and the v2.0 docs) is that `/verify-face` performs the server-side match, then `/check-in-face` records the session. But `/check-in-face` accepts `verificationConfidence` from the request body and writes it directly into `teacher_sessions.verification_confidence`. There is **no proof that `/verify-face` was actually called**, and no link between the two requests.

An authenticated teacher (or anyone who steals a teacher session) can call `/check-in-face` directly with:

```json
{ "studentId": "...", "action": "check_in", "verificationConfidence": 0.99 }
```

…and the session will be recorded as "face_recognition verified, 99% confidence" without any face ever being seen. The entire biometric guarantee collapses to "teacher had a valid auth token", which is no stronger than the existing QR flow but with audit logs that lie.

**Fix options, best first:**

1. **Merge the two endpoints.** `/verify-face` should do the match _and_ create/update the session in one transaction, returning the session ID. No second call needed.
2. **Issue a signed verification token.** `/verify-face` returns an HMAC-signed payload `{teacherId, studentId, confidence, exp}` with a 30-60s TTL. `/check-in-face` validates the signature and TTL, then trusts the embedded confidence. Store the JTI in Redis with one-time-use semantics so it cannot be replayed.
3. **At minimum,** make `/check-in-face` re-fetch the most recent successful audit row from `face_verification_audit` for `(teacherId, studentId)` within the last 60s, and use _that_ confidence — ignore the client value entirely.

The comment on line 152 (`verification_confidence: verificationConfidence`) saying it's "server-calculated" is currently a lie and will mislead future readers.

### C3 — Migration 018 constraint corrupts re-enrollment after the 2nd time

**File:** `supabase/migrations/018_student_face_records.sql:41`

```sql
CONSTRAINT unique_active_face_per_student UNIQUE (student_id, is_active)
    DEFERRABLE INITIALLY DEFERRED
```

A composite unique constraint on `(student_id, is_active)` enforces "at most one row per (student, is*active) pair" — i.e. one active row \_and* at most one inactive row per student. After the trigger `deactivate_old_face_records` deactivates older rows, the third enrollment will leave two `is_active = false` rows for the same student and violate the constraint at commit time. Re-enrollment will silently break the third time onward.

**Fix:** Replace the composite constraint with a partial unique index:

```sql
ALTER TABLE student_face_records DROP CONSTRAINT unique_active_face_per_student;

CREATE UNIQUE INDEX uniq_active_face_per_student
    ON student_face_records(student_id)
    WHERE is_active = true;
```

This enforces the actual invariant ("at most one active row per student") and leaves inactive rows free. Should be backfilled with a hot migration since this is already shipped.

---

## 🔴 High

### H1 — No liveness/anti-spoofing on biometric check-in

**Files:** `src/components/shared/FaceScanner.tsx`, `src/app/api/teacher-sessions/verify-face/route.ts`

The captured face descriptor is sent as a plain 128-float array. No challenge-response, no liveness signal, no eye-blink detection, no depth sensing. A teacher can hold up a phone showing a parent-supplied photo of a student and the descriptor will match. For a system used to bill parents for time-with-student, this is a meaningful integrity gap.

**Fix:** At minimum, add a per-session liveness gesture (blink, head-turn) verified client-side _and_ require two consecutive distinct captures with a small movement budget server-side. Better: gate face-only check-ins behind geofence + recent QR code, and treat face as a convenience layer rather than a sole credential.

### H2 — `verify-face` leaks distance/confidence on every outcome

**File:** `src/app/api/teacher-sessions/verify-face/route.ts:259-267`

The endpoint returns the precise `distance` and `confidence` for both matches and non-matches, including for "you are not assigned to this student" and "no enrollment" paths (well, those return zeros, but the success/no-match difference is reported in full precision). With the rate limit at 10/min and no IP banning enforced (see H4), an attacker could perform a **gradient ascent attack**: tweak descriptor values, observe the distance moving down, and converge on a synthetic descriptor that crosses the threshold without ever needing the real face.

**Fix:** Return only `matched: boolean` and a coarse confidence bucket (`high|medium|low`) to the client. Keep the precise distance in the audit log only.

### H3 — Authorization check on `teacher_assignments` table conflates "no row" with "no error"

**File:** `src/app/api/teacher-sessions/verify-face/route.ts:120-164`

```ts
const { data: assignment, error: assignmentError } = await adminClient
  .from('teacher_assignments')
  .select('id')
  .eq('teacher_id', teacherId)
  .eq('student_id', studentId)
  .single();

// …

const isAssigned =
  !assignmentError ||
  (Array.isArray(assignedTeachers) && assignedTeachers.includes(teacherId));
```

`!assignmentError` is meant to mean "assignment row exists" but actually means "the query did not error". For Supabase `.single()`, "no rows" returns error code `PGRST116`, so this _coincidentally_ works for the missing-row case. But any transient error (network blip, RLS denial against the admin client for some unforeseen reason, JSON parse fault) would make `assignmentError` truthy → `!assignmentError` false → fall back to the `assigned_teachers` array. That's the safe direction, but the logic is upside-down for the reader and one refactor away from breaking.

**Fix:** Use the data, not the error:

```ts
const isAssignedViaTable = assignment !== null;
const isAssignedViaArray =
  Array.isArray(assignedTeachers) && assignedTeachers.includes(teacherId);
const isAssigned = isAssignedViaTable || isAssignedViaArray;
```

Also: two different sources of truth for "is teacher assigned to student" (`teacher_assignments` table + `students.assigned_teachers` JSONB array) is itself a smell — they can drift. Pick one and migrate. The other recent commit `0c80194 fix(teacher): include teacher_assignments in student selection for data sheets` already hints this divergence is causing bugs elsewhere.

### H4 — Rate limiter fails open and never bans

**File:** `src/lib/rate-limit-redis.ts:281-286`

```ts
} catch (error) {
  console.error('Rate limiting error:', error);
  // Fallback: allow request but log the error
  return handler(request);
}
```

If Redis is unreachable — outage, misconfigured env vars, network partition — _every_ request is allowed through, including face-verify. Auto-ban (lines 224-227) is commented out, so even sustained abuse with Redis online produces no escalation. Combined with H2 (precise confidence leak) and the IP-keyed rate limit (no per-teacher key — `getUserId` is a TODO stub at line 107-113), the brute-force surface is wider than intended.

**Fix:**

1. For security-sensitive routes (face verify, login, biometric), fail _closed_ on Redis errors: return 503.
2. Implement `getUserId` so per-teacher buckets are real, then key by `teacher_id` _and_ IP simultaneously, taking the tighter of the two.
3. Enable IP banning after `max * N` violations within the window.

### H5 — Rate-limit window mutation happens before the limit check

**File:** `src/lib/rate-limit-redis.ts:209-216`

```ts
await redis.zadd(key, { score: now, member: requestId });
await redis.zremrangebyscore(key, 0, windowStart);
const count = await redis.zcard(key);
```

Every incoming request is added to the sorted set _before_ checking the count. An attacker firing at 1000 r/s past the limit still gets every request recorded — bloating the sorted set and forcing a `zremrangebyscore` every request — and your Upstash bill. Worse, between two near-simultaneous requests, both can sit at `count == max` and the second one passes (race) because there's no atomic check-and-increment.

**Fix:** Use a Lua script or `pipeline().multi()` to: `zremrangebyscore`, `zcard`, branch on count, `zadd` only if under limit. Or use `@upstash/ratelimit`'s fixed-window/sliding-window primitive, which already does this atomically.

---

## 🟡 Medium

### M1 — `face-encryption.ts` / `face-matching.ts` are not marked `server-only`

Both files use `process.env` and Node `crypto`. Without `import 'server-only'` at the top, a developer can accidentally import `compareFaceDescriptors` or `decryptFaceDescriptor` from a client component. Webpack/Next will let the build succeed and only fail at runtime — and `face-matching.ts` doesn't even depend on Node APIs, so a client import there would actually _work_, silently moving matching logic to the browser. Adding the import is one line and the build will catch the mistake.

### M2 — `distanceToConfidence` is a misleading linear mapping

**File:** `src/lib/face-matching.ts:101-105`

```ts
return 1 - clampedDistance;
```

face-api.js distances cluster between 0 and ~1.2 for same/different identities, with the meaningful decision boundary at ~0.4. A distance of 0.5 maps to "confidence 50%" which sounds borderline-good, but it's actually a **non-match** under the configured threshold. The UI then renders that as "verified at 50% confidence" in error messages and audit logs.

**Fix:** Map relative to the threshold:

```ts
// confidence = 1 when distance = 0, 0.5 at threshold, 0 at 2*threshold
const confidence = Math.max(0, 1 - distance / (2 * threshold));
```

Or use the sigmoid-ish mapping recommended by face-api authors. Update the audit table semantics if you change this.

### M3 — Audit logging is fire-and-forget but `await`-ed serially

**File:** `src/app/api/teacher-sessions/verify-face/route.ts:135-156, 167-188, 199-220, 240-248`

Each branch awaits `logFaceVerificationAttempt` before responding. The audit insert is a synchronous network round-trip to Supabase, adding ~50-150ms of latency to every verification (the user-visible path). Worse, if the audit insert fails (rare but possible), the error path now also throws and produces a generic 500.

**Fix:** Either:

- Fire the log without `await` and `.catch(console.error)` — accept some loss on cold shutdown,
- Or batch into a queue (e.g. Upstash QStash, or a Postgres `LISTEN/NOTIFY` consumer), or
- Use Vercel's `waitUntil(ctx)` (Edge runtime) / `after()` to run the log after the response is sent.

### M4 — `single()` queries don't tolerate the "no row" case explicitly

Throughout the new routes (`verify-face`, `check-in-face`, `assigned-students`) the pattern is:

```ts
const { data, error } = await client.from('x').select().eq(...).single();
if (error || !data) return 404;
```

This works because Supabase returns `error.code = 'PGRST116'` on zero rows, but it conflates "row not found" with "auth/network error". A user trying to verify a student they don't have access to gets the same 404 as a Supabase outage, making incident debugging harder.

**Fix:** Use `.maybeSingle()` for nullable lookups and branch on `data === null` separately from `error !== null`. Return 404 only for the null-data path.

### M5 — `face-encryption.ts:218` exports a `verifyEncryptionKeyConfiguration()` that `console.log`s

Not a leak (no key bytes), but it produces unstructured log noise in production. Use the project's `logger` (the diff already includes `src/lib/logger.ts`) for consistency. Same for the `console.error` calls scattered throughout the routes.

### M6 — `getClientIP` trusts the first `X-Forwarded-For` entry unconditionally

**Files:** `src/lib/api-security.ts:62-76`, `src/lib/rate-limit-redis.ts:81-100`

On Vercel that header is correct because Vercel rewrites it. Behind a misconfigured reverse proxy or a multi-hop chain, the first entry is attacker-controlled. Audit logs and rate-limit keys then get spoofed. Vercel's runtime exposes `request.headers.get('x-vercel-forwarded-for')` which is signed by the platform; prefer that when running on Vercel. At minimum, document the deployment assumption.

---

## 🟢 Low

- **L1.** `face-matching.ts:213-231` has the `errors.length >= 5` truncation pattern repeated three times. Extract a helper or just collect all and slice at the end.
- **L2.** `face-encryption.ts:55-99` uses `async` but never awaits anything (the Node `crypto` calls are synchronous). The async signature implies cost that isn't there. Either drop `async` or document why it's kept for forward compatibility.
- **L3.** Type assertions like `(student as { parent_id: string }).parent_id` appear ~20 times across these routes. Define a typed Supabase Database type for the new tables and let the generated types flow through. The project's `tsconfig` enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, which would catch real issues but only if the generated types reflect reality.
- **L4.** `face-audit.service.ts:212-216` builds the response by accessing `.size` on `Set<string>` _after_ assigning sets to the same object — readable but slightly confusing. The implicit type widening from `Set<string>` to `number` for the return is fine but worth a comment.
- **L5.** `check-in-face/route.ts:48` defaults `action: 'check_in'` in the validation-failure response shape, even when the actual action was `check_out`. Cosmetic, but it makes failed `check_out` calls look like failed check-ins in client logs.
- **L6.** `assigned-students/route.ts:69-86` falls back from `assigned_teachers` JSONB to `teacher_assignments` table only when the first query returns zero. If a teacher genuinely has zero students in JSONB but rows in the table (data drift), this works — but a teacher with one student in JSONB and ten more in the table will see only the one. See H3: pick one source of truth.

---

## ✅ Positive observations

- **AES-256-GCM with per-record IVs** is the right primitive for at-rest encryption of biometric templates. Auth-tag check is in place; tampering raises a clear error.
- **Test coverage on the crypto layer** (`face-encryption.test.ts`, `face-matching.test.ts`) hits the failure modes: NaN, Infinity, wrong length, IV uniqueness. Good.
- **Audit table design** with appropriate indexes (including the partial index on failed attempts) is well thought-out and gives you real forensic capability — assuming H4 and the rate-limiter weaknesses are addressed.
- **RLS policies on `student_face_records`** correctly scope parent reads/writes to their own students, and service_role policies are explicit rather than implicit — easier to audit.
- **The intent of separating client detection from server matching** (called out explicitly in JSDoc and CLAUDE.md) is the right architecture; the C2 bypass is a gap _within_ that architecture, not a rejection of it.
- **Zod validation at every API boundary** with size limits on notes (`max(1000)`), descriptor length (`length(128)`), and UUID format. Good defensive layer.
- **QR fallback** is preserved end-to-end, so a face-recognition outage doesn't lock out teachers. Important resilience choice.

---

## Suggested priority order

1. **Now (today):** C1 (rotate the PAT).
2. **Before next deploy:** C2 (merge endpoints or signed token), C3 (migration partial index — needs a backfill).
3. **This sprint:** H1 (liveness plan), H2 (coarsen response), H4 (fail closed + ban), H5 (atomic rate-limit).
4. **Next sprint:** H3 (clean up assignment dual-source), M1-M6.
5. **Backlog:** L1-L6.

C2 and C3 are the two that I'd block the next production push on; everything else can land in a follow-up PR.
