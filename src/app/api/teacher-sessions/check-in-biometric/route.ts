import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// Type for teacher session
interface TeacherSession {
  id: string;
  teacher_id: string;
  student_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  [key: string]: unknown;
}

const schema = z.object({
  studentId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  credentialId: z.string().min(1),
  signature: z.string().min(1),
  authenticatorData: z.string().min(1),
  clientDataJSON: z.string().min(1),
  challengeToken: z.string().min(1),
  userHandle: z.string().optional(),
});

/**
 * POST /api/teacher-sessions/check-in-biometric
 *
 * Check in with biometric authentication and location verification
 */
export const POST = withRateLimit({
  keyPrefix: 'api:teacher-sessions:check-in-biometric',
  max: 30, // 30 check-ins per minute
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
        latitude,
        longitude,
        accuracy,
        credentialId,
        signature,
        authenticatorData,
        clientDataJSON,
        challengeToken,
        userHandle,
      } = validation.data;

      const supabase = getSupabaseAdmin();

      // Step 1: Verify biometric authentication
      const verifyResponse = await fetch(
        `${request.nextUrl.origin}/api/biometric/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward caller auth so the internal /verify route's requireTeacher
            // middleware sees the same user. Without this, the call 401s.
            Authorization: request.headers.get('authorization') || '',
          },
          body: JSON.stringify({
            teacherId: user.id,
            credentialId,
            signature,
            authenticatorData,
            clientDataJSON,
            challengeToken,
            ...(userHandle ? { userHandle } : {}),
          }),
        }
      );

      if (!verifyResponse.ok) {
        return NextResponse.json(
          { error: 'Biometric authentication failed' },
          { status: 401 }
        );
      }

      const biometricResult = await verifyResponse.json();
      if (!biometricResult.verified) {
        return NextResponse.json(
          { error: 'Biometric authentication failed' },
          { status: 401 }
        );
      }

      // Step 2: Verify location
      const locationResponse = await fetch(
        `${request.nextUrl.origin}/api/location/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            latitude,
            longitude,
            accuracy,
          }),
        }
      );

      if (!locationResponse.ok) {
        return NextResponse.json(
          { error: 'Location verification failed' },
          { status: 400 }
        );
      }

      const locationResult = await locationResponse.json();
      if (!locationResult.withinGeofence) {
        return NextResponse.json(
          {
            error: 'Location verification failed',
            message: locationResult.message,
            distance: locationResult.distance,
            allowedRadius: locationResult.allowedRadius,
          },
          { status: 403 }
        );
      }

      // Step 3: Check for active sessions
      const { data: activeSessions } = await supabase
        .from('teacher_sessions')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', studentId)
        .is('checked_out_at', null);

      if (activeSessions && activeSessions.length > 0) {
        return NextResponse.json(
          { error: 'You already have an active session with this student' },
          { status: 409 }
        );
      }

      // Step 4: Create session
      const { data: session, error: sessionError } = (await supabase
        .from('teacher_sessions')
        .insert({
          teacher_id: user.id,
          student_id: studentId,
          checked_in_at: new Date().toISOString(),
          check_in_latitude: latitude,
          check_in_longitude: longitude,
          check_in_accuracy_meters: accuracy,
          check_in_distance_meters: locationResult.distance,
          location_verified: true,
          biometric_verified: true,
          verification_method: 'biometric_location',
        })
        .select()
        .single()) as { data: TeacherSession | null; error: Error | null };

      if (sessionError || !session) {
        console.error('Error creating session:', sessionError);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      // Step 5: Log verification
      await supabase.from('location_verification_log').insert({
        teacher_id: user.id,
        student_id: studentId,
        session_id: (session as any).id,
        latitude,
        longitude,
        accuracy_meters: accuracy,
        distance_meters: locationResult.distance,
        within_geofence: true,
        geofence_radius_meters: locationResult.allowedRadius,
        verification_type: 'check_in',
        success: true,
      });

      return NextResponse.json({
        success: true,
        sessionId: (session as any).id,
        checkedInAt: (session as any).checked_in_at,
        locationVerified: true,
        biometricVerified: true,
        distance: locationResult.distance,
        message:
          'Checked in successfully with biometric and location verification',
      });
    } catch (error) {
      console.error('Check-in error:', error);
      return NextResponse.json(
        { error: 'Failed to check in' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/teacher-sessions/check-in-biometric
 *
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Biometric Check-In API',
    version: '1.0',
    endpoints: {
      POST: {
        description:
          'Check in with biometric authentication and location verification',
        body: {
          studentId: 'string (UUID, required)',
          latitude: 'number (required, -90 to 90)',
          longitude: 'number (required, -180 to 180)',
          accuracy: 'number (required, GPS accuracy in meters)',
          credentialId: 'string (required)',
          signature: 'string (required, base64 encoded)',
          authenticatorData: 'string (required, base64 encoded)',
          clientDataJSON: 'string (required, base64 encoded)',
        },
      },
    },
  });
}
