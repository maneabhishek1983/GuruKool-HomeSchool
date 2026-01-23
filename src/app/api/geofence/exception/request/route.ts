import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { StudentRow, GeofenceExceptionRow } from '@/types/supabase';

const schema = z.object({
  studentId: z.string().uuid(),
  reason: z.string().min(10).max(500),
  alternateLocation: z.string().optional(),
  alternateLatitude: z.number().min(-90).max(90).optional(),
  alternateLongitude: z.number().min(-180).max(180).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
});

/**
 * POST /api/geofence/exception/request
 *
 * Request an exception to check in outside the geofence
 */
export const POST = withRateLimit({
  keyPrefix: 'api:geofence:exception:request',
  max: 10, // 10 requests per minute
})(
  requireTeacher(async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const validation = schema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const {
        studentId,
        reason,
        alternateLocation,
        alternateLatitude,
        alternateLongitude,
        validFrom,
        validUntil,
      } = validation.data;

      const supabase = getSupabaseAdmin();

      // Verify student exists and get parent ID
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('parent_id')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      // Type assertion for student
      const typedStudent = student as Pick<StudentRow, 'parent_id'>;

      // Verify teacher is assigned to this student
      const { data: assignment } = await supabase
        .from('teacher_assignments')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', studentId)
        .single();

      if (!assignment) {
        return NextResponse.json(
          { error: 'You are not assigned to this student' },
          { status: 403 }
        );
      }

      // Check for overlapping pending or approved exceptions
      const { data: existing } = await supabase
        .from('geofence_exceptions')
        .select('id, status')
        .eq('teacher_id', user.id)
        .eq('student_id', studentId)
        .in('status', ['pending', 'approved'])
        .gte('valid_until', validFrom)
        .lte('valid_from', validUntil);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          {
            error:
              'You already have a pending or approved exception for this time period',
          },
          { status: 409 }
        );
      }

      // Create exception request
      const { data: exception, error: insertError } = await supabase
        .from('geofence_exceptions')
        .insert({
          teacher_id: user.id,
          student_id: studentId,
          parent_id: typedStudent.parent_id,
          reason,
          alternate_location: alternateLocation,
          alternate_latitude: alternateLatitude,
          alternate_longitude: alternateLongitude,
          status: 'pending',
          valid_from: validFrom,
          valid_until: validUntil,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !exception) {
        console.error('Error creating exception:', insertError);
        return NextResponse.json(
          { error: 'Failed to create exception request' },
          { status: 500 }
        );
      }

      // Type assertion for exception
      const typedException = exception as GeofenceExceptionRow;

      // TODO: Send notification to parent
      // This would integrate with your notification system

      return NextResponse.json({
        success: true,
        exceptionId: typedException.id,
        status: 'pending',
        message: 'Exception request submitted. Waiting for parent approval.',
      });
    } catch (error) {
      console.error('Exception request error:', error);
      return NextResponse.json(
        { error: 'Failed to create exception request' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/geofence/exception/request
 *
 * List exception requests for the authenticated teacher
 */
export const GET = withRateLimit({
  keyPrefix: 'api:geofence:exception:request:list',
  max: 30, // 30 requests per minute
})(
  requireTeacher(async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const studentId = searchParams.get('studentId');
      const status = searchParams.get('status');

      const supabase = getSupabaseAdmin();

      let query = supabase
        .from('geofence_exceptions')
        .select('*, students(name), users(email)')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: exceptions, error } = await query;

      if (error) {
        console.error('Error fetching exceptions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch exception requests' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        exceptions: exceptions || [],
        count: exceptions?.length || 0,
      });
    } catch (error) {
      console.error('Error listing exceptions:', error);
      return NextResponse.json(
        { error: 'Failed to list exception requests' },
        { status: 500 }
      );
    }
  })
);
