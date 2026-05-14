/**
 * DB seed helpers for face-recognition E2E tests.
 *
 * Uses the Supabase service-role client (bypasses RLS) to directly seed
 * `student_face_records` rows so tests can exercise verify/check-in/delete
 * paths without depending on real camera capture.
 *
 * Safety:
 * - Refuses to run unless NEXT_PUBLIC_SUPABASE_URL looks like a test host
 *   (mirrors the guard in auth.setup.ts).
 * - Throws clearly if FACE_ENCRYPTION_KEY is missing — server-side
 *   verification would fail anyway, fail fast in the helper.
 *
 * Requires (env):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - FACE_ENCRYPTION_KEY (64-hex-char)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { encryptFaceDescriptor } from '../../src/lib/face-encryption';

const TEST_HOST_PATTERN = /test|staging|preview|local|127\.0\.0\.1/i;

/**
 * Public accessor for the admin client. Specs use this to inspect
 * side-effects (audit rows, session creation, soft-delete state).
 */
export function getAdminClient(): SupabaseClient {
  return getAdmin();
}

function getAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'face-seed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required'
    );
  }
  const allowHost = process.env.E2E_ALLOW_HOST;
  if (!(allowHost && url.includes(allowHost)) && !TEST_HOST_PATTERN.test(url)) {
    throw new Error(
      `face-seed: refusing to run against ${url} — not a recognized test host. ` +
        `Set E2E_ALLOW_HOST if intentional.`
    );
  }
  if (!process.env.FACE_ENCRYPTION_KEY) {
    throw new Error(
      'face-seed: FACE_ENCRYPTION_KEY not set — descriptor encryption would fail'
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface SeedEnrollmentOptions {
  studentId: string;
  descriptor: number[];
  qualityScore?: number;
  descriptorVersion?: string;
  /**
   * If true, the encrypted blob is intentionally corrupted (last byte flipped)
   * before storage. Use this to test auth-tag-mismatch handling in verify-face.
   */
  corrupt?: boolean;
}

export interface SeededEnrollment {
  id: string;
  studentId: string;
}

/**
 * Insert (or replace) an active face enrollment for a student.
 * Trigger `deactivate_old_face_records` in migration 018 will auto-deactivate
 * any prior active record, so this is safe to call repeatedly per test.
 */
export async function seedFaceEnrollment(
  opts: SeedEnrollmentOptions
): Promise<SeededEnrollment> {
  const admin = getAdmin();
  let blob = await encryptFaceDescriptor(opts.descriptor);

  if (opts.corrupt) {
    // Flip the last byte (part of the GCM auth tag) to force decrypt failure.
    blob = Buffer.from(blob);
    blob[blob.length - 1] ^= 0xff;
  }

  const { data, error } = await admin
    .from('student_face_records')
    .insert({
      student_id: opts.studentId,
      // Mirror face-enroll route: encode as Postgres BYTEA hex literal
      // so the bytes round-trip cleanly through PostgREST.
      face_descriptor_encrypted: '\\x' + blob.toString('hex'),
      quality_score: opts.qualityScore ?? 0.85,
      descriptor_version: opts.descriptorVersion ?? 'face-api-0.22.2',
      is_active: true,
    })
    .select('id, student_id')
    .single();

  if (error || !data) {
    throw new Error(`seedFaceEnrollment failed: ${error?.message}`);
  }
  return { id: data.id, studentId: data.student_id };
}

/**
 * Remove all face records for a student. Use in afterEach to keep tests
 * hermetic.
 */
export async function clearFaceEnrollments(studentId: string): Promise<void> {
  const admin = getAdmin();
  const { error } = await admin
    .from('student_face_records')
    .delete()
    .eq('student_id', studentId);
  if (error) {
    throw new Error(`clearFaceEnrollments failed: ${error.message}`);
  }
}

/**
 * Ensure a test student exists for `parentId` and return its id. Idempotent:
 * reuses an existing student with the marker name if present.
 */
export async function ensureTestStudent(parentId: string): Promise<string> {
  const admin = getAdmin();
  const MARKER = 'E2E Face Test Student';

  const { data: existing } = await admin
    .from('students')
    .select('id')
    .eq('parent_id', parentId)
    .eq('name', MARKER)
    .maybeSingle();
  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await admin
    .from('students')
    .insert({
      parent_id: parentId,
      name: MARKER,
      age: 10,
      country: 'UK',
      grade_level: 'Year 5',
      grade_system: 'uk_year',
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`ensureTestStudent failed: ${error?.message}`);
  }
  return data.id;
}

/**
 * Look up a user id by email — used to map E2E auth fixtures
 * (e.g. `e2e-parent@gurukool.test`) to their auth.users.id.
 */
export async function getUserIdByEmail(email: string): Promise<string> {
  const admin = getAdmin();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    throw new Error(`getUserIdByEmail failed: ${error.message}`);
  }
  const user = data.users.find(u => u.email === email);
  if (!user) {
    throw new Error(`getUserIdByEmail: no user for ${email}`);
  }
  return user.id;
}

/**
 * Force the descriptor_version of an existing enrollment — for tests that
 * verify the server rejects (or warns on) mismatched model versions.
 */
export async function setEnrollmentVersion(
  studentId: string,
  version: string
): Promise<void> {
  const admin = getAdmin();
  const { error } = await admin
    .from('student_face_records')
    .update({ descriptor_version: version })
    .eq('student_id', studentId)
    .eq('is_active', true);
  if (error) {
    throw new Error(`setEnrollmentVersion failed: ${error.message}`);
  }
}

/**
 * Ensure a `teachers` row exists for the given auth user. Idempotent.
 * `parentId` is required by the schema (the parent who created this teacher).
 */
export async function ensureTestTeacher(opts: {
  userId: string;
  parentId: string;
  email: string;
  name?: string;
}): Promise<string> {
  const admin = getAdmin();
  const { data: existing } = await admin
    .from('teachers')
    .select('id')
    .eq('user_id', opts.userId)
    .maybeSingle();
  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await admin
    .from('teachers')
    .insert({
      user_id: opts.userId,
      parent_id: opts.parentId,
      name: opts.name ?? 'E2E Test Teacher',
      email: opts.email,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`ensureTestTeacher failed: ${error?.message}`);
  }
  return data.id;
}

/**
 * Add `teacherId` (teachers.id) to a student's `assigned_teachers` JSONB array.
 * Mirrors the assignment check in verify-face / face-challenge.
 */
export async function assignTeacherToStudent(
  teacherId: string,
  studentId: string
): Promise<void> {
  const admin = getAdmin();
  const { data: student, error: readErr } = await admin
    .from('students')
    .select('assigned_teachers')
    .eq('id', studentId)
    .single();
  if (readErr || !student) {
    throw new Error(`assignTeacherToStudent read failed: ${readErr?.message}`);
  }
  const current = Array.isArray(
    (student as { assigned_teachers?: string[] }).assigned_teachers
  )
    ? ((student as { assigned_teachers: string[] })
        .assigned_teachers as string[])
    : [];
  if (current.includes(teacherId)) {
    return;
  }
  const next = [...current, teacherId];
  const { error: writeErr } = await admin
    .from('students')
    .update({ assigned_teachers: next })
    .eq('id', studentId);
  if (writeErr) {
    throw new Error(`assignTeacherToStudent write failed: ${writeErr.message}`);
  }
}

/**
 * Sign a test user in (password grant) and return the bearer access token.
 * Tests use this to call API routes directly without going through the UI.
 */
export async function getAccessToken(
  email: string,
  password: string
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('getAccessToken: NEXT_PUBLIC_SUPABASE_ANON_KEY required');
  }
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(`getAccessToken failed for ${email}: ${error?.message}`);
  }
  return data.session.access_token;
}
