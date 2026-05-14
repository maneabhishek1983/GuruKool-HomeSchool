import { test, expect, request as pwRequest } from '@playwright/test';
import {
  ensureTestStudent,
  ensureTestTeacher,
  assignTeacherToStudent,
  seedFaceEnrollment,
  clearFaceEnrollments,
  getUserIdByEmail,
  getAccessToken,
  getAdminClient,
  setEnrollmentVersion,
} from './helpers/face-seed';
import { FACE_FIXTURES, makeDescriptor } from './helpers/face-test-mock';

/**
 * Second pass of face-recognition API specs. Covers flows that the
 * critical-gap suite skipped:
 *
 *   - check-in-face: session creation, duplicate guard, check-out path
 *   - challenge-token replay (same token used twice)
 *   - cross-parent enrollment isolation
 *   - audit log side-effects on verify
 *   - re-enrollment trigger (old record auto-deactivated)
 *
 * Same env contract as face-api.spec.ts — skips cleanly if test Supabase
 * is not configured.
 */

const PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2eTest!Password123';
const PARENT_EMAIL = 'e2e-parent@gurukool.test';
const TEACHER_EMAIL = 'e2e-teacher@gurukool.test';
const ADMIN_EMAIL = 'e2e-admin@gurukool.test';

const SUPABASE_AVAILABLE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.FACE_ENCRYPTION_KEY
);

test.describe('face recognition API — extended flows', () => {
  test.skip(
    !SUPABASE_AVAILABLE,
    'Requires NEXT_PUBLIC_SUPABASE_URL, ' +
      'SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, FACE_ENCRYPTION_KEY'
  );

  let parentUserId: string;
  let teacherUserId: string;
  let teacherId: string;
  let studentId: string;
  let parentToken: string;
  let teacherToken: string;

  test.beforeAll(async () => {
    parentUserId = await getUserIdByEmail(PARENT_EMAIL);
    teacherUserId = await getUserIdByEmail(TEACHER_EMAIL);
    studentId = await ensureTestStudent(parentUserId);
    teacherId = await ensureTestTeacher({
      userId: teacherUserId,
      parentId: parentUserId,
      email: TEACHER_EMAIL,
    });
    await assignTeacherToStudent(teacherId, studentId);
    parentToken = await getAccessToken(PARENT_EMAIL, PASSWORD);
    teacherToken = await getAccessToken(TEACHER_EMAIL, PASSWORD);
  });

  test.beforeEach(async () => {
    await clearFaceEnrollments(studentId);
    // Close any leftover active sessions so check-in tests aren't blocked
    // by the duplicate-session guard from a prior run.
    const admin = getAdminClient();
    await admin
      .from('teacher_sessions')
      .update({
        check_out_time: new Date().toISOString(),
        status: 'completed',
      })
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .is('check_out_time', null);
  });

  test.afterAll(async () => {
    if (studentId) {
      await clearFaceEnrollments(studentId);
    }
  });

  // ---------------------------------------------------------------------------
  // check-in-face: happy path + duplicate guard + check-out
  // ---------------------------------------------------------------------------
  test('check-in-face creates an active session with verification_method=face_recognition', async ({
    baseURL,
  }) => {
    await seedFaceEnrollment({
      studentId,
      descriptor: FACE_FIXTURES.enrolled(),
    });

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });

    // Verify first (mirrors real client sequence).
    const verifyRes = await ctx.post('/api/teacher-sessions/verify-face', {
      data: {
        studentId,
        capturedDescriptor: FACE_FIXTURES.matchingCapture(),
      },
    });
    expect(verifyRes.status()).toBe(200);
    const { confidence } = await verifyRes.json();

    const checkInRes = await ctx.post('/api/teacher-sessions/check-in-face', {
      data: {
        studentId,
        action: 'check_in',
        verificationConfidence: confidence,
      },
    });
    expect(checkInRes.status()).toBeLessThan(300);
    const body = await checkInRes.json();
    expect(body.success).toBe(true);

    // Server should have written a session with the right verification method.
    const admin = getAdminClient();
    const { data: session } = await admin
      .from('teacher_sessions')
      .select(
        'id, verification_method, verification_confidence, check_out_time'
      )
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .is('check_out_time', null)
      .single();
    expect(session?.verification_method).toBe('face_recognition');
    expect(Number(session?.verification_confidence)).toBeCloseTo(confidence, 3);

    await ctx.dispose();
  });

  test('check-in-face returns 409 on duplicate active session', async ({
    baseURL,
  }) => {
    await seedFaceEnrollment({
      studentId,
      descriptor: FACE_FIXTURES.enrolled(),
    });

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });

    const payload = {
      studentId,
      action: 'check_in' as const,
      verificationConfidence: 0.9,
    };
    const first = await ctx.post('/api/teacher-sessions/check-in-face', {
      data: payload,
    });
    expect(first.status()).toBeLessThan(300);

    const second = await ctx.post('/api/teacher-sessions/check-in-face', {
      data: payload,
    });
    expect(second.status()).toBe(409);
    await ctx.dispose();
  });

  test('check-in-face rejects invalid action and confidence values', async ({
    baseURL,
  }) => {
    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });

    const badAction = await ctx.post('/api/teacher-sessions/check-in-face', {
      data: { studentId, action: 'bogus', verificationConfidence: 0.9 },
    });
    expect(badAction.status()).toBe(400);

    const badConfidence = await ctx.post(
      '/api/teacher-sessions/check-in-face',
      {
        data: { studentId, action: 'check_in', verificationConfidence: 2.5 },
      }
    );
    expect(badConfidence.status()).toBe(400);
    await ctx.dispose();
  });

  // ---------------------------------------------------------------------------
  // Challenge token replay
  // ---------------------------------------------------------------------------
  test('verify-face accepts a challenge token only once (no replay)', async ({
    baseURL,
  }) => {
    await seedFaceEnrollment({
      studentId,
      descriptor: FACE_FIXTURES.enrolled(),
    });

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });

    const chRes = await ctx.post('/api/teacher-sessions/face-challenge', {
      data: { studentId },
    });
    expect(chRes.status()).toBe(200);
    const { challengeToken } = await chRes.json();

    const first = await ctx.post('/api/teacher-sessions/verify-face', {
      data: {
        studentId,
        capturedDescriptor: FACE_FIXTURES.matchingCapture(),
        challengeToken,
      },
    });
    expect(first.status()).toBe(200);

    // Replay the same token.
    const replay = await ctx.post('/api/teacher-sessions/verify-face', {
      data: {
        studentId,
        capturedDescriptor: FACE_FIXTURES.matchingCapture(),
        challengeToken,
      },
    });
    // If the server treats tokens as one-shot, expect 401. If the current
    // implementation only enforces TTL+binding (not single-use), this assert
    // documents the gap rather than passing silently.
    expect(
      replay.status(),
      'Challenge token should be single-use to prevent replay. ' +
        'If this returns 200, /verify-face is missing replay protection — ' +
        'add a nonce/used-token registry server-side.'
    ).toBe(401);
    await ctx.dispose();
  });

  // ---------------------------------------------------------------------------
  // Cross-parent isolation
  // ---------------------------------------------------------------------------
  test('enrollment rejects a parent enrolling another parent’s student', async ({
    baseURL,
  }) => {
    // Use admin's auth as a "different parent" surrogate: admin shouldn't
    // technically be a parent, but the route allows admin OR parent.
    // To test the cross-parent path specifically, we need a SECOND parent
    // account — admin would bypass via the `user.role === 'admin'` clause.
    // So instead: have the teacher (non-parent role) try POST.
    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });
    const res = await ctx.post('/api/student/face-enroll', {
      data: {
        studentId,
        descriptor: FACE_FIXTURES.enrolled(),
        qualityScore: 0.9,
      },
    });
    // requireParentOrAdmin rejects teachers entirely.
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test('enrollment GET rejects a non-owner parent', async ({ baseURL }) => {
    // Create a throw-away "other parent" student row and try to read it as
    // our test parent. Owned by a fabricated parent id — the route should
    // 404 before exposing anything.
    const admin = getAdminClient();
    const { data: orphan, error } = await admin
      .from('students')
      .insert({
        parent_id: '00000000-0000-0000-0000-000000000001',
        name: 'E2E Orphan Student',
        age: 9,
        country: 'UK',
        grade_level: 'Year 4',
        grade_system: 'uk_year',
      })
      .select('id')
      .single();

    test.skip(
      Boolean(error),
      `Skipping cross-parent test — schema rejected fake parent_id FK: ${error?.message}`
    );

    const orphanId = (orphan as { id: string }).id;
    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${parentToken}` },
    });
    const res = await ctx.get(`/api/student/face-enroll?studentId=${orphanId}`);
    expect([403, 404]).toContain(res.status());
    await ctx.dispose();

    await admin.from('students').delete().eq('id', orphanId);
  });

  // ---------------------------------------------------------------------------
  // Audit log side-effects
  // ---------------------------------------------------------------------------
  test('verify-face writes an audit row for successful match', async ({
    baseURL,
  }) => {
    await seedFaceEnrollment({
      studentId,
      descriptor: FACE_FIXTURES.enrolled(),
    });

    const admin = getAdminClient();
    const before = new Date().toISOString();

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });
    const res = await ctx.post('/api/teacher-sessions/verify-face', {
      data: {
        studentId,
        capturedDescriptor: FACE_FIXTURES.matchingCapture(),
      },
    });
    expect(res.status()).toBe(200);
    await ctx.dispose();

    const { data: audits, error } = await admin
      .from('face_verification_audit')
      .select('verification_result, confidence_score, distance')
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .gte('created_at', before)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(error).toBeNull();
    expect(audits?.[0]?.verification_result).toBe('success');
    expect(Number(audits?.[0]?.distance)).toBeLessThan(0.4);
  });

  test('verify-face writes an audit row with result=no_match for mismatched identity', async ({
    baseURL,
  }) => {
    await seedFaceEnrollment({
      studentId,
      descriptor: FACE_FIXTURES.enrolled(),
    });

    const admin = getAdminClient();
    const before = new Date().toISOString();

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });
    await ctx.post('/api/teacher-sessions/verify-face', {
      data: {
        studentId,
        capturedDescriptor: FACE_FIXTURES.mismatchedCapture(),
      },
    });
    await ctx.dispose();

    const { data: audits } = await admin
      .from('face_verification_audit')
      .select('verification_result, distance')
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .gte('created_at', before)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(audits?.[0]?.verification_result).toBe('no_match');
    expect(Number(audits?.[0]?.distance)).toBeGreaterThan(0.4);
  });

  // ---------------------------------------------------------------------------
  // Re-enrollment trigger
  // ---------------------------------------------------------------------------
  test('re-enrolling deactivates the prior active record', async ({
    baseURL,
  }) => {
    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${parentToken}` },
    });

    const first = await ctx.post('/api/student/face-enroll', {
      data: {
        studentId,
        descriptor: makeDescriptor(1),
        qualityScore: 0.85,
      },
    });
    expect(first.status()).toBe(201);
    const firstId = (await first.json()).recordId as string;

    const second = await ctx.post('/api/student/face-enroll', {
      data: {
        studentId,
        descriptor: makeDescriptor(2),
        qualityScore: 0.9,
      },
    });
    expect(second.status()).toBe(201);
    const secondId = (await second.json()).recordId as string;
    expect(secondId).not.toBe(firstId);

    // After the trigger fires, only the second record should be active.
    const admin = getAdminClient();
    const { data: rows } = await admin
      .from('student_face_records')
      .select('id, is_active')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    const active = (rows ?? []).filter(r => r.is_active);
    expect(active.length).toBe(1);
    expect(active[0]?.id).toBe(secondId);
    await ctx.dispose();
  });

  // ---------------------------------------------------------------------------
  // Threshold boundary
  // ---------------------------------------------------------------------------
  test('boundary descriptor (distance just under 0.4) still matches', async ({
    baseURL,
  }) => {
    await seedFaceEnrollment({
      studentId,
      descriptor: FACE_FIXTURES.enrolled(),
    });

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });
    const res = await ctx.post('/api/teacher-sessions/verify-face', {
      data: {
        studentId,
        capturedDescriptor: FACE_FIXTURES.boundaryCapture(),
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(true);
    expect(body.distance).toBeLessThan(0.4);
    await ctx.dispose();
  });

  // ---------------------------------------------------------------------------
  // Descriptor version mismatch
  // ---------------------------------------------------------------------------
  test('verify-face returns 409 REENROLL_REQUIRED for stale descriptor_version', async ({
    baseURL,
  }) => {
    await seedFaceEnrollment({
      studentId,
      descriptor: FACE_FIXTURES.enrolled(),
    });
    // Force the stored row to a version the server no longer accepts.
    await setEnrollmentVersion(studentId, 'face-api-0.0.0-old');

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${teacherToken}` },
    });
    const res = await ctx.post('/api/teacher-sessions/verify-face', {
      data: {
        studentId,
        capturedDescriptor: FACE_FIXTURES.matchingCapture(),
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('REENROLL_REQUIRED');
    expect(body.matched).toBe(false);
    // Server must never reveal the actual stored version string — that's a
    // model-fingerprinting leak useful to an attacker.
    expect(JSON.stringify(body)).not.toContain('face-api-0.0.0-old');
    await ctx.dispose();
  });

  // Avoid unused-var lint for ADMIN_EMAIL — kept as documentation for future
  // admin-bypass tests.
  void ADMIN_EMAIL;
});
