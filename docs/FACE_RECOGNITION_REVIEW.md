# Face Recognition Logic Review & Recommendations

**Review Date:** 2026-01-28
**Reviewer:** Antigravity Agent
**Subject:** Face Recognition Documentation (`docs/FACE_RECOGNITION_*.md`)

---

> ## ⚠ STATUS: SUPERSEDED (verified 2026-05-10)
>
> The "Critical Security Vulnerability" described below was about a **proposed**
> design from `FACE_RECOGNITION_DESIGN.md`. **It was never shipped.** The
> implemented code in `src/lib/face-matching.ts` and
> `src/app/api/teacher-sessions/verify-face/route.ts` calculates Euclidean
> distance **server-side** from the decrypted enrolled descriptor and never
> reads `confidence` from the client. Server-side verification is enforced.
>
> Recommendation #2 (pgvector) remains a valid optimization but is not a
> security blocker. The current JSONB-with-encryption approach is correct.
>
> Keep this file as historical context; do not treat its "Critical" framing as
> describing current code.
>
> **Current threat model and QA checklist live in
> [`BIOMETRIC_THREAT_MODEL.md`](./BIOMETRIC_THREAT_MODEL.md).**

---

## Executive Summary

The documentation set (PRD, Design, Tasks) provides a solid foundation for the Face Recognition feature. The choice of `face-api.js` for client-side interactivity is appropriate. However, there is a **Critical Security Vulnerability** in the proposed Check-In API design where the server trusts the client-provided match confidence.

## Critical Findings

### 1. Insecure Verification Logic (High Severity)

**Issue:** The `FACE_RECOGNITION_DESIGN.md` (Section 4.2) and `TASKS.md` (Task 2.2) propose sending `confidence` as part of the `POST` request payload.

```typescript
interface FaceCheckInRequest {
  studentId: string;
  confidence: number; // ⚠ TRUSTING CLIENT INPUT
  ...
}
```

**Risk:** A malicious actor (or compromised teacher device) could hit this endpoint with any `studentId` and `confidence: 0.99` to successfully spoof a check-in, bypassing the biometric check entirely.
**Recommendation:**

- The API must **NOT** trust the client's `confidence` score for authorization.
- The Client should send the `capturedFaceDescriptor`.
- The Server should fetch the securely stored `enrolledFaceDescriptor` for the claimed `studentId`.
- The **Server** must perform the distance calculation/comparison and determine if it meets the threshold.
- _Refinement_: If server-side `face-api` is too heavy, at minimum, the server must require a signed "proof of work" or similar, but server-side vector comparison is the only truly secure method if we rely on the embedding.

### 2. Database Schema Optimization

**Issue:** The schema uses `JSONB` for `face_descriptor`.
**Recommendation:**

- Use **`pgvector`** extension if available on Supabase instance.
- Change column type to `vector(128)`.
- This enables:
  - Faster server-side comparison (L2 Distance / Cosine Similarity).
  - Future capability for "Identify Student" (1:N search) instead of just "Verify Student" (1:1).
  - `student_id` is sufficient for 1:1, but `vector` type is more efficient for storage and math operations than JSON arrays.

## Additional Suggestions

### 3. Model Loading & Performance

- **Issue:** Loading ~10-20MB of models on mobile data will be slow and sensitive to network flakes.
- **Suggestion:**
  - Implement a **Service Worker** to cache model files aggressively.
  - Use `IndexedDB` to store the model artifacts after first download.
  - Providing a "Download Models" step during Teacher Dashboard loading (before they even click Check-In).

### 4. Privacy & Encryption

- **Issue:** The design mentions "Encrypt face_descriptor column".
- **Refinement:** If using `pgvector`, encryption breaks the vector properties (cannot do distance math on encrypted data).
- **Trade-off:**
  - **Option A (Secure Storage)**: Encrypt blob. Server must decrypt to compare. Slower, no index search.
  - **Option B (Searchable)**: Store raw vector. Fast 1:N search.
  - **Recommendation**: Since the primary use case is **Verification** (1:1 matching against a specific student), **Option A** is better for privacy. We fetch the encrypted record by `student_id`, decrypt in memory, and compare.

### 5. Implementation Plan Adjustments

- **Task 2.2**: Update to include server-side `euclideanDistance` logic.
- **Task 1.5**: Reference `face-api.js` nodejs wrappers or a lightweight vector math utility for the server.

## Action Plan

1.  **Update Design**: Modify `FACE_RECOGNITION_DESIGN.md` to reflect Server-Side Verification.
2.  **Update Tasks**: Update `FACE_RECOGNITION_TASKS.md` to reflect the change in API payload and server logic.
3.  **Proceed**: Start implementation with these security patches.
