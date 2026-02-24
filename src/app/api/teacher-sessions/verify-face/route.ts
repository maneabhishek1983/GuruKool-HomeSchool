import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRedisRateLimit } from '@/lib/rate-limit-redis';
import { requireTeacherOrAdmin } from '@/lib/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';
import { decryptFaceDescriptor } from '@/lib/face-encryption';
import {
  compareFaceDescriptors,
  validateDescriptor,
} from '@/lib/face-matching';
import { logFaceVerificationAttempt } from '@/services/face-audit.service';
import { getClientIP, getDeviceInfo } from '@/lib/api-security';
import type { FaceVerifyResponse } from '@/types';

/**
 * Face Verification Request Schema
 *
 * SECURITY CRITICAL:
 * - NO confidence field - server calculates this from distance
 * - Client sends raw descriptor, server performs matching
 * - Never trust client-provided match results
 */
const verifyFaceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  capturedDescriptor: z
    .array(z.number())
    .length(128, 'Descriptor must have exactly 128 elements'),
  // NOTE: NO confidence field - this is calculated server-side
});

/**
 * POST /api/teacher-sessions/verify-face
 * Verify a captured face against enrolled student face
 *
 * SECURITY CRITICAL:
 * - All matching calculations happen server-side
 * - Client only sends the captured face descriptor
 * - Server fetches encrypted enrolled descriptor and decrypts it
 * - Server calculates Euclidean distance and confidence
 * - All attempts are logged for security auditing
 *
 * Auth: Requires teacher role (or admin)
 * Rate Limit: 10 requests per minute per teacher
 */
export const POST = withRedisRateLimit({
  keyPrefix: 'api:face:verify',
  max: 10,
  windowMs: 60 * 1000, // 1 minute
})(
  requireTeacherOrAdmin(async (request, { user, supabase }) => {
    const adminClient = getSupabaseAdmin();
    const ipAddress = getClientIP(request);
    const deviceInfo = getDeviceInfo(request);

    // Variables for audit logging
    let studentId = '';
    let teacherId = '';
    let distance = 0;
    let confidence = 0;

    try {
      // Parse and validate request body
      const body = await request.json();
      const validation = verifyFaceSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            matched: false,
            confidence: 0,
            distance: 0,
            message: 'Validation failed',
          } as FaceVerifyResponse,
          { status: 400 }
        );
      }

      studentId = validation.data.studentId;
      const { capturedDescriptor } = validation.data;

      // Validate descriptor structure
      const descriptorValidation = validateDescriptor(capturedDescriptor);
      if (!descriptorValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            matched: false,
            confidence: 0,
            distance: 0,
            message: 'Invalid face descriptor',
          } as FaceVerifyResponse,
          { status: 400 }
        );
      }

      // Get teacher record for this user
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacher) {
        return NextResponse.json(
          {
            success: false,
            matched: false,
            confidence: 0,
            distance: 0,
            message: 'Teacher profile not found',
          } as FaceVerifyResponse,
          { status: 404 }
        );
      }

      teacherId = String((teacher as { id: string }).id);

      // Verify teacher is assigned to this student
      // NOTE: teacher_assignments.teacher_id stores users.id (FK constraint)
      // while students.assigned_teachers stores teachers.id
      const { data: assignment, error: assignmentError } = await adminClient
        .from('teacher_assignments')
        .select('id')
        .eq('teacher_id', user.id) // Use user.id for teacher_assignments FK
        .eq('student_id', studentId)
        .single();

      // Also check if student has teacher in assigned_teachers array
      const { data: student, error: studentError } = await adminClient
        .from('students')
        .select('id, name, grade, assigned_teachers')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        await logFaceVerificationAttempt({
          teacherId,
          studentId,
          result: 'error',
          confidence: 0,
          distance: 0,
          deviceInfo,
          ipAddress,
          errorMessage: 'Student not found',
        });

        return NextResponse.json(
          {
            success: false,
            matched: false,
            confidence: 0,
            distance: 0,
            message: 'Student not found',
          } as FaceVerifyResponse,
          { status: 404 }
        );
      }

      // Check assignment (either via teacher_assignments table or assigned_teachers array)
      const assignedTeachers = (student as { assigned_teachers?: string[] })
        .assigned_teachers;
      const isAssigned =
        !assignmentError ||
        (Array.isArray(assignedTeachers) &&
          assignedTeachers.includes(teacherId));

      if (!isAssigned && user.role !== 'admin') {
        await logFaceVerificationAttempt({
          teacherId,
          studentId,
          result: 'failed',
          confidence: 0,
          distance: 0,
          deviceInfo,
          ipAddress,
          errorMessage: 'Teacher not assigned to student',
        });

        return NextResponse.json(
          {
            success: false,
            matched: false,
            confidence: 0,
            distance: 0,
            message: 'You are not assigned to this student',
          } as FaceVerifyResponse,
          { status: 403 }
        );
      }

      // Fetch encrypted face descriptor from database
      const { data: faceRecord, error: faceError } = await adminClient
        .from('student_face_records')
        .select('face_descriptor_encrypted')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();

      if (faceError || !faceRecord) {
        await logFaceVerificationAttempt({
          teacherId,
          studentId,
          result: 'failed',
          confidence: 0,
          distance: 0,
          deviceInfo,
          ipAddress,
          errorMessage: 'No face enrolled for student',
        });

        return NextResponse.json(
          {
            success: false,
            matched: false,
            confidence: 0,
            distance: 0,
            message: 'Student does not have face enrollment',
          } as FaceVerifyResponse,
          { status: 404 }
        );
      }

      // Decrypt the enrolled face descriptor (server-side only)
      const encryptedData = (
        faceRecord as { face_descriptor_encrypted: Buffer }
      ).face_descriptor_encrypted;
      const enrolledDescriptor = await decryptFaceDescriptor(
        Buffer.from(encryptedData)
      );

      // Compare descriptors (SERVER-SIDE CALCULATION)
      const matchResult = compareFaceDescriptors(
        enrolledDescriptor,
        capturedDescriptor
      );

      distance = matchResult.distance;
      confidence = matchResult.confidence;

      // Log the verification attempt
      await logFaceVerificationAttempt({
        teacherId,
        studentId,
        result: matchResult.matched ? 'success' : 'no_match',
        confidence: matchResult.confidence,
        distance: matchResult.distance,
        deviceInfo,
        ipAddress,
      });

      // Prepare student info for response
      const studentInfo = {
        id: String((student as { id: string }).id),
        name: String((student as { name: string }).name),
        grade: String((student as { grade: string }).grade),
      };

      return NextResponse.json({
        success: true,
        matched: matchResult.matched,
        confidence: matchResult.confidence,
        distance: matchResult.distance,
        student: matchResult.matched ? studentInfo : undefined,
        message: matchResult.matched
          ? `Face verified (${Math.round(matchResult.confidence * 100)}% confidence)`
          : `Face does not match (${Math.round(matchResult.confidence * 100)}% confidence)`,
        verifiedAt: new Date().toISOString(),
      } as FaceVerifyResponse);
    } catch (error) {
      console.error('Error in face verification:', error);

      // Log the error
      if (teacherId && studentId) {
        await logFaceVerificationAttempt({
          teacherId,
          studentId,
          result: 'error',
          confidence,
          distance,
          deviceInfo,
          ipAddress,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return NextResponse.json(
        {
          success: false,
          matched: false,
          confidence: 0,
          distance: 0,
          message: 'Internal server error during verification',
        } as FaceVerifyResponse,
        { status: 500 }
      );
    }
  })
);
