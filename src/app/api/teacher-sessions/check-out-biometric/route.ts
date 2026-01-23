import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// Type for teacher session with student relation
interface TeacherSessionWithStudent {
  id: string;
  teacher_id: string;
  student_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  notes: string | null;
  students: {
    id: string;
    home_latitude: number | null;
    home_longitude: number | null;
    geofence_radius_meters: number | null;
  };
  [key: string]: unknown;
}

// Type for updated teacher session
interface TeacherSessionUpdated {
  id: string;
  checked_in_at: string;
  checked_out_at: string;
  [key: string]: unknown;
}

const schema = z.object({
  sessionId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  credentialId: z.string().min(1),
  signature: z.string().min(1),
  authenticatorData: z.string().min(1),
  clientDataJSON: z.string().min(1),
  notes: z.string().optional(),
});

/**
 * POST /api/teacher-sessions/check-out-biometric
 *
 * Check out with biometric authentication and location verification
 */
export const POST = withRateLimit({
  keyPrefix: 'api:teacher-sessions:check-out-biometric',
  max: 30, // 30 check-outs per minute
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
        sessionId,
        latitude,
        longitude,
        accuracy,
        credentialId,
        signature,
        authenticatorData,
        clientDataJSON,
        notes,
      } = validation.data;

      const supabase = getSupabaseAdmin();

      // Step 1: Verify session exists and belongs to teacher
      const { data: session, error: sessionError } = (await supabase
        .from('teacher_sessions')
        .select(
          '*, students(id, home_latitude, home_longitude, geofence_radius_meters)'
        )
        .eq('id', sessionId)
        .eq('teacher_id', user.id)
        .is('checked_out_at', null)
        .single()) as {
        data: TeacherSessionWithStudent | null;
        error: Error | null;
      };

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Session not found or already checked out' },
          { status: 404 }
        );
      }

      // Step 2: Verify biometric authentication
      const verifyResponse = await fetch(
        `${request.nextUrl.origin}/api/biometric/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId: user.id,
            credentialId,
            signature,
            authenticatorData,
            clientDataJSON,
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

      // Step 3: Verify location
      const locationResponse = await fetch(
        `${request.nextUrl.origin}/api/location/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: session.student_id,
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

      // Step 4: Calculate session duration
      const checkedInAt = new Date(session.checked_in_at);
      const checkedOutAt = new Date();
      const durationMinutes = Math.round(
        (checkedOutAt.getTime() - checkedInAt.getTime()) / 60000
      );

      // Step 5: Update session
      const { data: updatedSession, error: updateError } = (await supabase
        .from('teacher_sessions')
        .update({
          checked_out_at: checkedOutAt.toISOString(),
          check_out_latitude: latitude,
          check_out_longitude: longitude,
          check_out_accuracy_meters: accuracy,
          check_out_distance_meters: locationResult.distance,
          notes: notes || session.notes,
        })
        .eq('id', sessionId)
        .select()
        .single()) as {
        data: TeacherSessionUpdated | null;
        error: Error | null;
      };

      if (updateError || !updatedSession) {
        console.error('Error updating session:', updateError);
        return NextResponse.json(
          { error: 'Failed to check out' },
          { status: 500 }
        );
      }

      // Step 6: Log verification
      await supabase.from('location_verification_log').insert({
        teacher_id: user.id,
        student_id: session.student_id,
        session_id: sessionId,
        latitude,
        longitude,
        accuracy_meters: accuracy,
        distance_meters: locationResult.distance,
        within_geofence: true,
        geofence_radius_meters: locationResult.allowedRadius,
        verification_type: 'check_out',
        success: true,
      });

      return NextResponse.json({
        success: true,
        sessionId: updatedSession.id,
        checkedInAt: updatedSession.checked_in_at,
        checkedOutAt: updatedSession.checked_out_at,
        durationMinutes,
        locationVerified: true,
        biometricVerified: true,
        distance: locationResult.distance,
        message:
          'Checked out successfully with biometric and location verification',
      });
    } catch (error) {
      console.error('Check-out error:', error);
      return NextResponse.json(
        { error: 'Failed to check out' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/teacher-sessions/check-out-biometric
 *
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Biometric Check-Out API',
    version: '1.0',
    endpoints: {
      POST: {
        description:
          'Check out with biometric authentication and location verification',
        body: {
          sessionId: 'string (UUID, required)',
          latitude: 'number (required, -90 to 90)',
          longitude: 'number (required, -180 to 180)',
          accuracy: 'number (required, GPS accuracy in meters)',
          credentialId: 'string (required)',
          signature: 'string (required, base64 encoded)',
          authenticatorData: 'string (required, base64 encoded)',
          clientDataJSON: 'string (required, base64 encoded)',
          notes: 'string (optional)',
        },
      },
    },
  });
}
