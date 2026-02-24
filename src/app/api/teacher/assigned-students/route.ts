import { NextRequest, NextResponse } from 'next/server';
import { withRedisRateLimit } from '@/lib/rate-limit-redis';
import { requireTeacherOrAdmin } from '@/lib/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AssignedStudentWithFaceStatus } from '@/types';

/**
 * GET /api/teacher/assigned-students
 * Get list of students assigned to the teacher with face enrollment status
 *
 * SECURITY NOTE:
 * - This endpoint does NOT return face descriptors
 * - Only returns boolean indicating if face is enrolled
 * - Face descriptors are only accessed server-side during verification
 *
 * Auth: Requires teacher role (or admin)
 * Rate Limit: 60 requests per minute
 */
export const GET = withRedisRateLimit({
  keyPrefix: 'api:teacher:students',
  max: 60,
  windowMs: 60 * 1000,
})(
  requireTeacherOrAdmin(async (request, { user, supabase }) => {
    try {
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
            error: 'Teacher profile not found',
            code: 'TEACHER_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      const teacherId = String((teacher as { id: string }).id);
      const adminClient = getSupabaseAdmin();

      // Fetch students where teacher is in assigned_teachers array
      // We query from students table where assigned_teachers contains this teacher
      const { data: students, error: studentsError } = await adminClient
        .from('students')
        .select('id, name, grade')
        .contains('assigned_teachers', [teacherId]);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch students',
            code: 'FETCH_FAILED',
          },
          { status: 500 }
        );
      }

      // If no students found via assigned_teachers, try teacher_assignments table
      let studentList = students || [];

      if (studentList.length === 0) {
        // NOTE: teacher_assignments.teacher_id stores users.id (FK constraint)
        const { data: assignments, error: assignmentsError } = await adminClient
          .from('teacher_assignments')
          .select('student_id')
          .eq('teacher_id', user.id) // teacher_assignments uses users.id
          .eq('is_active', true);

        if (!assignmentsError && assignments && assignments.length > 0) {
          const studentIds = assignments.map(a =>
            String((a as { student_id: string }).student_id)
          );
          const { data: assignedStudents } = await adminClient
            .from('students')
            .select('id, name, grade')
            .in('id', studentIds);

          studentList = assignedStudents || [];
        }
      }

      // Get face enrollment status for all students
      const studentIds = studentList.map(s => String((s as { id: string }).id));

      const faceEnrollmentMap = new Map<string, boolean>();

      if (studentIds.length > 0) {
        const { data: faceRecords } = await adminClient
          .from('student_face_records')
          .select('student_id')
          .in('student_id', studentIds)
          .eq('is_active', true);

        if (faceRecords) {
          for (const record of faceRecords) {
            const sid = String((record as { student_id: string }).student_id);
            faceEnrollmentMap.set(sid, true);
          }
        }
      }

      // Get active sessions for all students
      const activeSessionMap = new Map<string, string>();

      if (studentIds.length > 0) {
        const { data: activeSessions } = await adminClient
          .from('teacher_sessions')
          .select('student_id, check_in_time')
          .eq('teacher_id', teacherId)
          .is('check_out_time', null)
          .in('student_id', studentIds);

        if (activeSessions) {
          for (const session of activeSessions) {
            const sid = String((session as { student_id: string }).student_id);
            const checkInTime = (session as { check_in_time: string })
              .check_in_time;
            activeSessionMap.set(sid, checkInTime);
          }
        }
      }

      // Build response
      const studentsWithStatus: AssignedStudentWithFaceStatus[] =
        studentList.map(student => {
          const id = String((student as { id: string }).id);
          return {
            id,
            name: String((student as { name: string }).name),
            grade: String((student as { grade: string }).grade),
            hasFaceEnrolled: faceEnrollmentMap.get(id) || false,
            hasActiveSession: activeSessionMap.has(id),
            lastCheckIn: activeSessionMap.get(id),
          };
        });

      return NextResponse.json({
        success: true,
        data: {
          students: studentsWithStatus,
          totalCount: studentsWithStatus.length,
          withFaceEnrollment: studentsWithStatus.filter(s => s.hasFaceEnrolled)
            .length,
          withActiveSessions: studentsWithStatus.filter(s => s.hasActiveSession)
            .length,
        },
      });
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  })
);
