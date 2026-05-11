import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { withRedisRateLimit } from '@/lib/rate-limit-redis';
import { requireTeacherOrAdmin } from '@/lib/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';
import { issueChallengeToken } from '@/lib/webauthn-challenge-token';

/**
 * POST /api/teacher-sessions/face-challenge
 *
 * Issues a short-lived, HMAC-signed challenge token bound to a specific
 * (teacher, student) pair. The client must echo this token on the subsequent
 * call to POST /api/teacher-sessions/verify-face. Replay protection: each
 * token has a 2-minute TTL, and the verify endpoint refuses tokens whose
 * resourceId (studentId) doesn't match the body's studentId.
 *
 * Authorization: the caller must be a teacher (or admin), and must be
 * assigned to the requested student. This mirrors the assignment check
 * already performed in /verify-face — failing fast here avoids letting an
 * unauthorized teacher even obtain a token.
 *
 * Rate limit: 30 challenges per minute per teacher. Higher than verify (10)
 * because a single check-in can require multiple attempts (no face detected,
 * liveness retry, etc.).
 */

const requestSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
});

export const POST = withRedisRateLimit({
  keyPrefix: 'api:face:challenge',
  max: 30,
  windowMs: 60 * 1000,
})(
  requireTeacherOrAdmin(async (request, { user, supabase }) => {
    try {
      const body = await request.json();
      const parsed = requestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }
      const { studentId } = parsed.data;

      // Resolve teacher row for this auth user.
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacher) {
        return NextResponse.json(
          { error: 'Teacher profile not found' },
          { status: 404 }
        );
      }

      const teacherId = String((teacher as { id: string }).id);
      const admin = getSupabaseAdmin();

      // Authorization: teacher must be assigned to the student. Same check
      // as /verify-face — either via teacher_assignments table or the
      // students.assigned_teachers array.
      const { data: assignment } = await admin
        .from('teacher_assignments')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('student_id', studentId)
        .maybeSingle();

      let authorized = !!assignment;
      if (!authorized) {
        const { data: student } = await admin
          .from('students')
          .select('assigned_teachers')
          .eq('id', studentId)
          .maybeSingle();
        const assigned =
          (student as { assigned_teachers?: string[] } | null)
            ?.assigned_teachers ?? [];
        authorized = Array.isArray(assigned) && assigned.includes(teacherId);
      }

      if (!authorized) {
        return NextResponse.json(
          { error: 'Not authorized to verify this student' },
          { status: 403 }
        );
      }

      // Issue token. Challenge is a 32-byte random base64 — fed only into
      // the HMAC, not consumed by the verify path (face-verify doesn't use
      // it as a WebAuthn challenge; it's there for entropy + future-proofing).
      const challenge = crypto.randomBytes(32).toString('base64');
      const token = issueChallengeToken({
        challenge,
        userId: user.id,
        action: 'face-verify',
        resourceId: studentId,
        ttlSeconds: 120, // 2 min — much shorter than the 5min webauthn default
      });

      return NextResponse.json({
        challengeToken: token,
        expiresInSeconds: 120,
      });
    } catch (err) {
      console.error('[face-challenge] error:', err);
      return NextResponse.json(
        { error: 'Failed to issue challenge' },
        { status: 500 }
      );
    }
  })
);
