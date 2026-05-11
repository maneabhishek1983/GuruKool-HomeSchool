# Biometric Threat Model

**Last reviewed:** 2026-05-10
**Owner:** Engineering
**Scope:** Web app face check-in flow + WebAuthn biometric check-in flow.
**Out of scope:** Flutter `gurukool_teacher/` native app (separate threat model).

This document enumerates which attacks the biometric stack defends against, how the defense works, and which residual risks we explicitly accept. It is the source of truth for security reviews and the QA test plan below.

---

## Defended attacks

| #   | Attack                                                                                                                                  | Defense in place                                                                                                                                                                                                                                                                                                                              | Code reference                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | **WebAuthn signature replay** — attacker captures a successful biometric authentication payload and replays it later.                   | Server validates the WebAuthn signature against the stored public key + verifies `newCounter > storedCounter` on every successful auth. Counter update is conditional on the stored value (optimistic-concurrency); concurrent replay attempts conflict and return 409.                                                                       | `src/app/api/biometric/verify/route.ts`, `src/services/webauthn.service.ts`                                 |
| 2   | **WebAuthn challenge tampering** — attacker forges or manipulates the challenge.                                                        | Challenge is bound to user-id + action + 5-min expiry, signed with `JWT_SECRET` (HMAC-SHA256). Client must echo the token; server verifies signature and expiry before passing the challenge to `@simplewebauthn/server`.                                                                                                                     | `src/lib/webauthn-challenge-token.ts`                                                                       |
| 3   | **Face descriptor replay** — attacker captures a successful face check-in network call and replays it for a different student/session.  | Verify endpoint requires a `challengeToken` issued by `/api/teacher-sessions/face-challenge` for the exact (teacher, student) pair. Token is HMAC-signed, has a 2-min TTL, and binds `resourceId` (studentId). Token reuse across students fails the resource-mismatch check. Currently enabled flag-gated via `FACE_CHALLENGE_REQUIRED` env. | `src/app/api/teacher-sessions/face-challenge/route.ts`, `src/app/api/teacher-sessions/verify-face/route.ts` |
| 4   | **Printed photo / phone screen replay** (Presentation Attack Level 1) — attacker holds a 2D image of an enrolled student to the camera. | Passive liveness via Eye Aspect Ratio (EAR) blink detection. The verify flow requires at least one blink during the capture window before submitting the descriptor. Static images never produce a blink signal.                                                                                                                              | `src/lib/face-liveness.ts`, `src/components/shared/FaceScanner.tsx`                                         |
| 5   | **Server-trusts-client confidence** — earlier docs warned a malicious client could send `confidence: 0.99` and bypass matching.         | The `/verify-face` schema has **no `confidence` field**. Server decrypts the enrolled descriptor and calculates Euclidean distance itself. Client confidence (if any) is ignored.                                                                                                                                                             | `src/app/api/teacher-sessions/verify-face/route.ts`, `src/lib/face-matching.ts`                             |
| 6   | **Cross-parent data exposure via biometric data**                                                                                       | Face descriptors are AES-256-GCM encrypted at rest using `FACE_ENCRYPTION_KEY`; RLS policies enforce per-parent isolation on enrollment rows.                                                                                                                                                                                                 | `src/lib/face-encryption.ts`, `supabase/migrations/`                                                        |
| 7   | **Unauthenticated access to biometric APIs**                                                                                            | All routes are gated by `requireTeacher` / `requireTeacherOrAdmin` middleware. The `e2e/api-contract.spec.ts` suite asserts every route rejects unauthenticated requests (regression net).                                                                                                                                                    | `e2e/api-contract.spec.ts`, `src/lib/auth-middleware.ts`                                                    |
| 8   | **Cross-tenant biometric verify** (teacher tries to verify a student they're not assigned to)                                           | Both `/face-challenge` and `/verify-face` check `teacher_assignments` and `students.assigned_teachers` before issuing a token or computing a match.                                                                                                                                                                                           | `src/app/api/teacher-sessions/face-challenge/route.ts`, `src/app/api/teacher-sessions/verify-face/route.ts` |
| 9   | **Brute-force face verify** (many descriptors against one enrolled face)                                                                | Per-teacher rate limit: 10 verifies/minute. (Per-student inner limit deferred — see "Open follow-ups".)                                                                                                                                                                                                                                       | `src/app/api/teacher-sessions/verify-face/route.ts`                                                         |

---

## Accepted residual risks

| #   | Risk                                                                                                                                 | Why accepted                                                                                                                                                          | Mitigation if it becomes contractual                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Deepfake video that satisfies the blink challenge.** A real-time generative video that simulates blinks would defeat EAR liveness. | Requires defeat capability at the level of CVE-class adversaries; our user base (homeschool families and small-org teachers) is not a realistic target.               | Add second-factor (rPPG, head-pose challenge) or the DMFC-FAS hybrid model. Currently deferred — adds 10-20MB to mobile bundle. |
| R2  | **High-fidelity silicone masks (PAD Level 2/3).**                                                                                    | ISO 30107-3 Level 2+ testing requires accredited labs and is not feasible in-house.                                                                                   | External certification engagement if a customer requires it.                                                                    |
| R3  | **Biometric injection attacks** (rooted device, hijacked camera pipeline, OS-level interception).                                    | Defense requires hardware attestation chains (Secure Enclave / TEE) we don't have on the web platform. CEN/TS 18099 lab certification is out of scope.                | Migrate the check-in flow to the Flutter app's `local_auth` (which uses platform TEE) and verify the attestation server-side.   |
| R4  | **MITM TLS interception with stolen client certs.**                                                                                  | Vercel handles TLS termination; we trust the platform CA chain. Certificate pinning is impractical for the web app (no installable cert store).                       | Implement certificate pinning in the Flutter app for that surface.                                                              |
| R5  | **Compromised JWT_SECRET**                                                                                                           | Would let an attacker forge challenge tokens for both WebAuthn and face flows. We treat this as a secrets-management problem, not a biometric problem.                | Rotate `JWT_SECRET`; revoke all active sessions on rotation.                                                                    |
| R6  | **Side-channel timing on descriptor distance**                                                                                       | Euclidean distance is computed in pure JS — not constant-time. A sufficiently sophisticated attacker could in theory glean information about the enrolled descriptor. | Use a constant-time vector comparison. Deferred: the threat is far below our adversary tier.                                    |

---

## Standards alignment

| Standard                                       | Alignment                     | Notes                                                                                                                                     |
| ---------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **FIDO Biometrics Requirements v4.0** — intent | Aligned                       | WebAuthn config uses `authenticatorAttachment: 'platform'` + `userVerification: 'required'` (equivalent to FIDO BIOMETRIC_STRONG intent). |
| **FIDO statistical FAR/FRR certification**     | Not pursued                   | Requires a 245-subject cohort + accredited lab. Out of scope for this product.                                                            |
| **ISO/IEC 30107-3 Level 1 PAD**                | Tested via QA checklist below | Achievable in-house with consumer printers/screens.                                                                                       |
| **ISO/IEC 30107-3 Level 2/3 PAD**              | Not pursued                   | Requires silicone masks + 7-day expert evaluation.                                                                                        |
| **CEN/TS 18099 IAD**                           | Not pursued                   | Requires 40-day accredited evaluation.                                                                                                    |

---

## QA test plan — PAD Level 1 checklist

Run this checklist before each release where face or biometric code has changed. File the results in `docs/biometric-qa-runs/<date>.md`.

### Setup

- [ ] Production-equivalent build deployed to a staging preview URL
- [ ] One enrolled student face (use your own enrolled into a test student account)
- [ ] Inkjet print of the enrolled face, full-page, glossy paper
- [ ] Same face displayed on a phone screen at 100% brightness
- [ ] Same face on a tablet screen
- [ ] 5-second video clip of the face blinking, played on a phone

### Test matrix

For each attack instrument, attempt face check-in 3 times. **All 9 paper/screen attempts must be rejected.** Video replay attempts are expected to _currently pass_ (R1) — file the result so we track when DMFC-FAS becomes a contractual requirement.

| Instrument                            | Attempts | Result expectation          | Defense             |
| ------------------------------------- | -------- | --------------------------- | ------------------- |
| Printed face — held still             | 3        | All rejected                | Liveness (no blink) |
| Printed face — wiggled to fake motion | 3        | All rejected                | Liveness (no blink) |
| Phone screen — static photo           | 3        | All rejected                | Liveness (no blink) |
| Tablet screen — static photo          | 3        | All rejected                | Liveness (no blink) |
| Phone screen — blink video            | 3        | **Pass** (residual risk R1) | None today          |
| Genuine live face, no blink           | 3        | All rejected                | Liveness gate       |
| Genuine live face, blink              | 3        | All pass                    | Happy path          |

### Network-level checks

- [ ] Capture one successful `/verify-face` request via DevTools. Replay it within 5 seconds: must return 401 (token reuse / expired).
- [ ] Modify the replayed request's `studentId` to another assigned student: must return 401 (resource-mismatch).
- [ ] Try `/verify-face` without `Authorization`: must return 401.
- [ ] Try `/verify-face` without `challengeToken` when `FACE_CHALLENGE_REQUIRED=true`: must return 400.

### Sign-off

- [ ] Engineer
- [ ] QA
- [ ] Date

---

## Open follow-ups

1. **Per-student rate limit on `/verify-face`** — currently per-teacher only. A teacher could spam attempts against one student. See ticket B4 in `.claude/plans/validate-review-and-use-zesty-crane.md`.
2. **Flutter app threat model** — write a parallel doc once the native check-in flow is in scope.
3. **Flag-flip** — `FACE_CHALLENGE_REQUIRED=true` after one release of clients shipping with token plumbing.
