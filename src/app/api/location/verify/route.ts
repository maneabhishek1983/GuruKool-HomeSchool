import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { StudentRow } from '@/types/supabase';

const schema = z.object({
  studentId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
});

/**
 * POST /api/location/verify
 *
 * Verify if teacher's location is within student's geofence
 */
export const POST = withRateLimit({
  keyPrefix: 'api:location:verify',
  max: 60, // 60 requests per minute
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

      const { studentId, latitude, longitude, accuracy } = validation.data;

      // Get Supabase admin client
      const supabase = getSupabaseAdmin();

      // Get student's home location
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(
          'home_latitude, home_longitude, geofence_radius_meters, home_address'
        )
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      // Type assertion for student
      const typedStudent = student as Pick<
        StudentRow,
        | 'home_latitude'
        | 'home_longitude'
        | 'geofence_radius_meters'
        | 'home_address'
      >;

      // Check if student has location set
      if (!typedStudent.home_latitude || !typedStudent.home_longitude) {
        return NextResponse.json(
          {
            error: 'Student home location not configured',
            message:
              'Please ask the parent to set up the home address in student settings.',
          },
          { status: 400 }
        );
      }

      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        latitude,
        longitude,
        typedStudent.home_latitude,
        typedStudent.home_longitude
      );

      const allowedRadius = typedStudent.geofence_radius_meters || 100;
      const withinGeofence = distance <= allowedRadius;

      // Log verification attempt
      await supabase.from('location_verification_log').insert({
        teacher_id: user.id,
        student_id: studentId,
        latitude,
        longitude,
        accuracy_meters: accuracy,
        distance_meters: distance,
        within_geofence: withinGeofence,
        geofence_radius_meters: allowedRadius,
        verification_type: 'manual_check',
        success: withinGeofence,
        error_message: withinGeofence ? null : 'Outside geofence',
      });

      // Return verification result
      return NextResponse.json({
        withinGeofence,
        distance: Math.round(distance),
        allowedRadius,
        accuracy: Math.round(accuracy),
        studentAddress: typedStudent.home_address,
        message: withinGeofence
          ? `You are within the allowed area (${Math.round(distance)}m from home)`
          : `You are ${Math.round(distance - allowedRadius)}m too far from the student's home`,
      });
    } catch (error) {
      console.error('Location verification error:', error);
      return NextResponse.json(
        { error: 'Failed to verify location' },
        { status: 500 }
      );
    }
  })
);

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * GET /api/location/verify
 *
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Location Verification API',
    version: '1.0',
    endpoints: {
      POST: {
        description: 'Verify teacher location against student geofence',
        body: {
          studentId: 'string (UUID, required)',
          latitude: 'number (required, -90 to 90)',
          longitude: 'number (required, -180 to 180)',
          accuracy: 'number (required, GPS accuracy in meters)',
        },
      },
    },
  });
}
