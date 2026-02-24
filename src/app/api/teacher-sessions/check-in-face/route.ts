import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRedisRateLimit } from '@/lib/rate-limit-redis';
import { requireTeacherOrAdmin } from '@/lib/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { FaceCheckInResponse } from '@/types';

/**
 * Face Check-In Request Schema
 *
 * This should be called AFTER successful face verification
 * The verificationConfidence is the server-calculated confidence
 * from the verify-face endpoint
 */
const checkInFaceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  action: z.enum(['check_in', 'check_out']),
  verificationConfidence: z.number().min(0).max(1),
  notes: z.string().max(1000).optional(),
});

/**
 * POST /api/teacher-sessions/check-in-face
 * Create or update a session after successful face verification
 *
 * This endpoint should only be called after a successful verify-face call
 * It records the verification method as 'face_recognition' and stores
 * the server-calculated confidence score
 *
 * Auth: Requires teacher role (or admin)
 * Rate Limit: 30 requests per minute
 */
export const POST = withRedisRateLimit({
  keyPrefix: 'api:face:checkin',
  max: 30,
  windowMs: 60 * 1000,
})(
  requireTeacherOrAdmin(async (request, { user, supabase }) => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const validation = checkInFaceSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            action: 'check_in',
            timestamp: new Date().toISOString(),
            message: 'Validation failed',
          } as FaceCheckInResponse,
          { status: 400 }
        );
      }

      const { studentId, action, verificationConfidence, notes } =
        validation.data;

      // Get teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacher) {
        return NextResponse.json(
          {
            success: false,
            action,
            timestamp: new Date().toISOString(),
            message: 'Teacher profile not found',
          } as FaceCheckInResponse,
          { status: 404 }
        );
      }

      const teacherId = String((teacher as { id: string }).id);
      const adminClient = getSupabaseAdmin();

      // Verify student exists and teacher is assigned
      const { data: student, error: studentError } = await adminClient
        .from('students')
        .select('id, name, parent_id, assigned_teachers')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          {
            success: false,
            action,
            timestamp: new Date().toISOString(),
            message: 'Student not found',
          } as FaceCheckInResponse,
          { status: 404 }
        );
      }

      // Check assignment via both methods for compatibility:
      // 1. teacher_assignments table (teacher_id stores users.id)
      // 2. students.assigned_teachers JSONB array (stores teachers.id)
      const { data: assignment } = await adminClient
        .from('teacher_assignments')
        .select('id')
        .eq('teacher_id', user.id) // teacher_assignments uses users.id
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();

      const assignedTeachers = (student as { assigned_teachers?: string[] })
        .assigned_teachers;
      const isAssigned =
        assignment !== null ||
        (Array.isArray(assignedTeachers) && assignedTeachers.includes(teacherId));

      if (!isAssigned && user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            action,
            timestamp: new Date().toISOString(),
            message: 'You are not assigned to this student',
          } as FaceCheckInResponse,
          { status: 403 }
        );
      }

      const timestamp = new Date().toISOString();
      const parentId = (student as { parent_id: string }).parent_id;

      if (action === 'check_in') {
        // Check for existing active session
        const { data: existingSession } = await adminClient
          .from('teacher_sessions')
          .select('id')
          .eq('teacher_id', teacherId)
          .eq('student_id', studentId)
          .is('check_out_time', null)
          .single();

        if (existingSession) {
          return NextResponse.json(
            {
              success: false,
              sessionId: String((existingSession as { id: string }).id),
              action,
              timestamp,
              message: 'Student already has an active session',
            } as FaceCheckInResponse,
            { status: 409 }
          );
        }

        // Create new session
        const { data: session, error: sessionError } = await adminClient
          .from('teacher_sessions')
          .insert({
            teacher_id: teacherId,
            student_id: studentId,
            parent_id: parentId,
            check_in_time: timestamp,
            verification_method: 'face_recognition',
            verification_confidence: verificationConfidence,
            notes: notes || null,
            status: 'active',
          })
          .select('id')
          .single();

        if (sessionError || !session) {
          console.error('Error creating session:', sessionError);
          return NextResponse.json(
            {
              success: false,
              action,
              timestamp,
              message: 'Failed to create session',
            } as FaceCheckInResponse,
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          sessionId: String((session as { id: string }).id),
          action,
          timestamp,
          message: 'Check-in successful via face recognition',
        } as FaceCheckInResponse);
      } else {
        // Check out - find active session
        const { data: activeSession, error: sessionFetchError } =
          await adminClient
            .from('teacher_sessions')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('student_id', studentId)
            .is('check_out_time', null)
            .single();

        if (sessionFetchError || !activeSession) {
          return NextResponse.json(
            {
              success: false,
              action,
              timestamp,
              message: 'No active session found for this student',
            } as FaceCheckInResponse,
            { status: 404 }
          );
        }

        const sessionId = String((activeSession as { id: string }).id);

        // Update session with check-out time
        const { error: updateError } = await adminClient
          .from('teacher_sessions')
          .update({
            check_out_time: timestamp,
            status: 'completed',
            notes: notes
              ? `${notes} (verified by face recognition)`
              : 'Verified by face recognition',
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error('Error updating session:', updateError);
          return NextResponse.json(
            {
              success: false,
              sessionId,
              action,
              timestamp,
              message: 'Failed to complete check-out',
            } as FaceCheckInResponse,
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          sessionId,
          action,
          timestamp,
          message: 'Check-out successful via face recognition',
        } as FaceCheckInResponse);
      }
    } catch (error) {
      console.error('Error in face check-in:', error);
      return NextResponse.json(
        {
          success: false,
          action: 'check_in',
          timestamp: new Date().toISOString(),
          message: 'Internal server error',
        } as FaceCheckInResponse,
        { status: 500 }
      );
    }
  })
);
