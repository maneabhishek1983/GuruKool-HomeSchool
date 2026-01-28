import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRedisRateLimit } from '@/lib/rate-limit-redis';
import { requireParentOrAdmin } from '@/lib/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';
import { encryptFaceDescriptor } from '@/lib/face-encryption';
import { validateDescriptor } from '@/lib/face-matching';
import type { FaceEnrollResponse } from '@/types';

/**
 * Face Enrollment Request Schema
 * Validates the face descriptor array and metadata
 */
const faceEnrollSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  descriptor: z
    .array(z.number())
    .length(128, 'Descriptor must have exactly 128 elements'),
  qualityScore: z.number().min(0).max(1),
  metadata: z
    .object({
      device: z.string().optional(),
      browser: z.string().optional(),
      lighting: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
      angle: z.enum(['frontal', 'slight_left', 'slight_right']).optional(),
    })
    .optional(),
});

/**
 * POST /api/student/face-enroll
 * Enroll a student's face for recognition
 *
 * SECURITY:
 * - Requires parent authentication
 * - Parent must own the student
 * - Face descriptor is encrypted before storage
 * - Rate limited to prevent abuse
 *
 * Auth: Requires parent role (or admin)
 * Rate Limit: 5 requests per minute
 */
export const POST = withRedisRateLimit({
  keyPrefix: 'api:face:enroll',
  max: 5,
  windowMs: 60 * 1000, // 1 minute
})(
  requireParentOrAdmin(async (request, { user, supabase }) => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const validation = faceEnrollSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'Validation failed',
            details: validation.error.errors,
          },
          { status: 400 }
        );
      }

      const { studentId, descriptor, qualityScore, metadata } = validation.data;

      // Additional descriptor validation
      const descriptorValidation = validateDescriptor(descriptor);
      if (!descriptorValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid face descriptor',
            message: 'Invalid face descriptor',
          },
          { status: 400 }
        );
      }

      // Verify parent owns this student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, parent_id')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          {
            success: false,
            error: 'Student not found',
            message: 'Student not found',
          },
          { status: 404 }
        );
      }

      // Check ownership (admin can bypass)
      const studentParentId = (student as { parent_id: string }).parent_id;
      if (user.role !== 'admin' && studentParentId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'You can only enroll faces for your own students',
            message: 'You can only enroll faces for your own students',
          },
          { status: 403 }
        );
      }

      // Encrypt the face descriptor
      const encryptedDescriptor = await encryptFaceDescriptor(descriptor);

      // Prepare enrollment metadata
      const enrollmentMetadata = {
        device: metadata?.device,
        browser: metadata?.browser,
        lighting: metadata?.lighting,
        angle: metadata?.angle,
        capturedAt: new Date().toISOString(),
      };

      // Use admin client to insert (bypasses RLS for service operations)
      const adminClient = getSupabaseAdmin();

      // Insert new face record (trigger will deactivate old ones)
      const { data: faceRecord, error: insertError } = await adminClient
        .from('student_face_records')
        .insert({
          student_id: studentId,
          face_descriptor_encrypted: encryptedDescriptor,
          descriptor_version: 'face-api-0.22.2',
          quality_score: qualityScore,
          enrollment_metadata: enrollmentMetadata,
          is_active: true,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error enrolling face:', insertError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to enroll face',
            message: 'Failed to enroll face',
          },
          { status: 500 }
        );
      }

      const recordId = faceRecord
        ? String((faceRecord as { id: string }).id)
        : undefined;

      return NextResponse.json(
        {
          success: true,
          recordId,
          message: 'Face enrolled successfully',
        } as FaceEnrollResponse,
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in face enrollment:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: 'Internal server error',
        },
        { status: 500 }
      );
    }
  })
);

/**
 * DELETE /api/student/face-enroll
 * Delete (deactivate) a student's face enrollment
 *
 * Auth: Requires parent role (or admin)
 * Rate Limit: 10 requests per minute
 */
export const DELETE = withRedisRateLimit({
  keyPrefix: 'api:face:delete',
  max: 10,
  windowMs: 60 * 1000,
})(
  requireParentOrAdmin(async (request, { user, supabase }) => {
    try {
      const url = new URL(request.url);
      const studentId = url.searchParams.get('studentId');

      if (!studentId) {
        return NextResponse.json(
          {
            success: false,
            error: 'studentId query parameter is required',
            code: 'MISSING_STUDENT_ID',
          },
          { status: 400 }
        );
      }

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(studentId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid student ID format',
            code: 'INVALID_STUDENT_ID',
          },
          { status: 400 }
        );
      }

      // Verify parent owns this student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, parent_id')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          {
            success: false,
            error: 'Student not found',
            code: 'STUDENT_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Check ownership
      const studentParentId = (student as { parent_id: string }).parent_id;
      if (user.role !== 'admin' && studentParentId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'You can only delete faces for your own students',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      // Use admin client to update
      const adminClient = getSupabaseAdmin();

      // Soft delete by setting is_active = false
      const { error: updateError } = await adminClient
        .from('student_face_records')
        .update({ is_active: false })
        .eq('student_id', studentId)
        .eq('is_active', true);

      if (updateError) {
        console.error('Error deleting face record:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to delete face record',
            code: 'DELETE_FAILED',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Face data deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting face enrollment:', error);
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

/**
 * GET /api/student/face-enroll
 * Check if a student has face enrollment
 *
 * Auth: Requires parent role (or admin)
 */
export const GET = withRedisRateLimit({
  keyPrefix: 'api:face:status',
  max: 100,
  windowMs: 60 * 1000,
})(
  requireParentOrAdmin(async (request, { user, supabase }) => {
    try {
      const url = new URL(request.url);
      const studentId = url.searchParams.get('studentId');

      if (!studentId) {
        return NextResponse.json(
          {
            success: false,
            error: 'studentId query parameter is required',
            code: 'MISSING_STUDENT_ID',
          },
          { status: 400 }
        );
      }

      // Verify parent owns this student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, parent_id')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          {
            success: false,
            error: 'Student not found',
            code: 'STUDENT_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Check ownership
      const studentParentId = (student as { parent_id: string }).parent_id;
      if (user.role !== 'admin' && studentParentId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      // Check for active face record
      const adminClient = getSupabaseAdmin();
      const { data: faceRecord, error: faceError } = await adminClient
        .from('student_face_records')
        .select('id, quality_score, created_at')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();

      const hasEnrollment = !faceError && faceRecord !== null;

      return NextResponse.json({
        success: true,
        data: {
          hasEnrollment,
          qualityScore: hasEnrollment
            ? (faceRecord as { quality_score: number }).quality_score
            : null,
          enrolledAt: hasEnrollment
            ? (faceRecord as { created_at: string }).created_at
            : null,
        },
      });
    } catch (error) {
      console.error('Error checking face enrollment:', error);
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
