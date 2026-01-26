import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// Type for verification methods
type VerificationMethod = 'qr' | 'biometric' | 'geofence';
type VerificationLevel = 'basic' | 'standard' | 'enhanced' | 'maximum';

// Schema for unified check-in request
const schema = z.object({
  studentId: z.string().uuid(),
  parentId: z.string().uuid(),
  sessionType: z.enum(['sign_in', 'sign_out']),
  verificationMethods: z.array(z.enum(['qr', 'biometric', 'geofence'])),
  verificationScore: z.number().min(0).max(1),
  verificationLevel: z.enum(['basic', 'standard', 'enhanced', 'maximum']),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().positive(),
      timestamp: z.number(),
    })
    .optional(),
  notes: z.string().optional(),
  qrCodeId: z.string().uuid().optional(),
  biometricCredentialId: z.string().optional(),
});

/**
 * POST /api/teacher-sessions/unified-checkin
 *
 * Unified check-in endpoint that supports multiple verification methods
 * Creates a session with comprehensive verification data
 */
export const POST = withRateLimit({
  keyPrefix: 'api:teacher-sessions:unified-checkin',
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
        parentId,
        sessionType,
        verificationMethods,
        verificationScore,
        verificationLevel,
        location,
        notes,
        qrCodeId,
        biometricCredentialId,
      } = validation.data;

      const supabase = getSupabaseAdmin();

      // Verify teacher-student assignment exists
      const { data: assignment, error: assignmentError } = await supabase
        .from('teacher_qr_codes')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('student_id', studentId)
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .single();

      if (assignmentError || !assignment) {
        return NextResponse.json(
          { error: 'You are not assigned to this student' },
          { status: 403 }
        );
      }

      // Handle sign_in vs sign_out
      if (sessionType === 'sign_in') {
        // Check if teacher has ANY active session (prevent concurrent sessions)
        const { data: activeSessions } = await supabase
          .from('teacher_sessions')
          .select('id, student_id, students:student_id(name)')
          .eq('teacher_id', user.id)
          .is('session_end', null);

        if (activeSessions && activeSessions.length > 0) {
          // Get student name from the active session
          const activeSession = activeSessions[0];
          const studentData = activeSession?.students as unknown;
          const studentInfo = Array.isArray(studentData)
            ? (studentData[0] as { name: string } | undefined)
            : (studentData as { name: string } | null);
          const studentName = studentInfo?.name || 'another student';

          return NextResponse.json(
            {
              error: `You already have an active session with ${studentName}. Please end that session before starting a new one.`,
              existingSession: {
                id: activeSession?.id,
                studentId: activeSession?.student_id,
              },
            },
            { status: 409 }
          );
        }

        // Create new session
        const sessionData: Record<string, unknown> = {
          teacher_id: user.id,
          student_id: studentId,
          parent_id: parentId,
          session_type: sessionType,
          session_start: new Date().toISOString(),
          verification_status: 'verified',
          verification_method: verificationMethods.join(','),
          verification_score: verificationScore,
          verification_level: verificationLevel,
          notes: notes || null,
        };

        // Add location data if available
        if (location) {
          sessionData.check_in_latitude = location.latitude;
          sessionData.check_in_longitude = location.longitude;
          sessionData.check_in_accuracy_meters = location.accuracy;
          sessionData.location_verified =
            verificationMethods.includes('geofence');
        }

        // Add QR code reference if used
        if (qrCodeId) {
          sessionData.qr_code_used = qrCodeId;
        }

        // Add biometric reference if used
        sessionData.biometric_verified =
          verificationMethods.includes('biometric');
        if (biometricCredentialId) {
          sessionData.biometric_credential_id = biometricCredentialId;
        }

        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (sessionError || !session) {
          console.error('Error creating session:', sessionError);
          return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
          );
        }

        // Update QR code usage if applicable
        if (qrCodeId) {
          await supabase
            .from('teacher_qr_codes')
            .update({
              last_used: new Date().toISOString(),
            })
            .eq('id', qrCodeId);
        }

        // Log verification for audit trail
        await logVerification(supabase, {
          teacherId: user.id,
          studentId,
          sessionId: session.id,
          verificationType: 'check_in',
          verificationMethods,
          verificationScore,
          verificationLevel,
          location: location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.timestamp,
              }
            : undefined,
          success: true,
        });

        return NextResponse.json({
          success: true,
          session,
          message: getSuccessMessage(verificationMethods, sessionType),
          verifications: {
            qr: verificationMethods.includes('qr'),
            biometric: verificationMethods.includes('biometric'),
            geofence: verificationMethods.includes('geofence'),
          },
          verificationLevel,
          verificationScore: Math.round(verificationScore * 100),
        });
      } else {
        // Handle sign_out - find active session and close it
        const { data: activeSession, error: findError } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('teacher_id', user.id)
          .eq('student_id', studentId)
          .is('session_end', null)
          .order('session_start', { ascending: false })
          .limit(1)
          .single();

        if (findError || !activeSession) {
          return NextResponse.json(
            { error: 'No active session found to end' },
            { status: 404 }
          );
        }

        // Calculate duration
        const sessionStart = new Date(activeSession.session_start).getTime();
        const sessionEnd = Date.now();
        const durationMinutes = Math.round(
          (sessionEnd - sessionStart) / (1000 * 60)
        );

        // Update session with end time and checkout data
        const updateData: Record<string, unknown> = {
          session_end: new Date().toISOString(),
          duration_minutes: durationMinutes,
          checkout_verification_method: verificationMethods.join(','),
          checkout_verification_score: verificationScore,
        };

        if (location) {
          updateData.check_out_latitude = location.latitude;
          updateData.check_out_longitude = location.longitude;
          updateData.check_out_accuracy_meters = location.accuracy;
          updateData.checkout_location_verified =
            verificationMethods.includes('geofence');
        }

        updateData.checkout_biometric_verified =
          verificationMethods.includes('biometric');

        if (notes) {
          updateData.notes = activeSession.notes
            ? `${activeSession.notes}\n\nCheckout: ${notes}`
            : `Checkout: ${notes}`;
        }

        const { data: updatedSession, error: updateError } = await supabase
          .from('teacher_sessions')
          .update(updateData)
          .eq('id', activeSession.id)
          .select()
          .single();

        if (updateError || !updatedSession) {
          console.error('Error updating session:', updateError);
          return NextResponse.json(
            { error: 'Failed to end session' },
            { status: 500 }
          );
        }

        // Log verification for audit trail
        await logVerification(supabase, {
          teacherId: user.id,
          studentId,
          sessionId: activeSession.id,
          verificationType: 'check_out',
          verificationMethods,
          verificationScore,
          verificationLevel,
          location: location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.timestamp,
              }
            : undefined,
          success: true,
        });

        return NextResponse.json({
          success: true,
          session: updatedSession,
          message: getSuccessMessage(verificationMethods, sessionType),
          duration: {
            minutes: durationMinutes,
            formatted: formatDuration(durationMinutes),
          },
          verifications: {
            qr: verificationMethods.includes('qr'),
            biometric: verificationMethods.includes('biometric'),
            geofence: verificationMethods.includes('geofence'),
          },
          verificationLevel,
          verificationScore: Math.round(verificationScore * 100),
        });
      }
    } catch (error) {
      console.error('Unified check-in error:', error);
      return NextResponse.json(
        { error: 'Failed to process check-in/out' },
        { status: 500 }
      );
    }
  })
);

/**
 * Log verification for audit trail
 */
async function logVerification(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: {
    teacherId: string;
    studentId: string;
    sessionId: string;
    verificationType: 'check_in' | 'check_out';
    verificationMethods: VerificationMethod[];
    verificationScore: number;
    verificationLevel: VerificationLevel;
    location?:
      | {
          latitude: number;
          longitude: number;
          accuracy: number;
          timestamp: number;
        }
      | undefined;
    success: boolean;
  }
) {
  try {
    await supabase.from('location_verification_log').insert({
      teacher_id: data.teacherId,
      student_id: data.studentId,
      session_id: data.sessionId,
      verification_type: data.verificationType,
      verification_methods: data.verificationMethods,
      verification_score: data.verificationScore,
      verification_level: data.verificationLevel,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      accuracy_meters: data.location?.accuracy,
      success: data.success,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to log verification:', error);
  }
}

/**
 * Get success message based on verification methods
 */
function getSuccessMessage(
  methods: VerificationMethod[],
  sessionType: 'sign_in' | 'sign_out'
): string {
  const action = sessionType === 'sign_in' ? 'Checked in' : 'Checked out';
  const verifications = [];

  if (methods.includes('qr')) {
    verifications.push('QR code');
  }
  if (methods.includes('biometric')) {
    verifications.push('biometric');
  }
  if (methods.includes('geofence')) {
    verifications.push('location');
  }

  if (verifications.length === 0) {
    return `${action} successfully`;
  }

  return `${action} successfully with ${verifications.join(', ')} verification`;
}

/**
 * Format duration in minutes to human readable string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
}

/**
 * GET /api/teacher-sessions/unified-checkin
 *
 * Documentation endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Unified Check-In API',
    version: '1.0',
    description: 'Unified teacher check-in/out with multi-factor verification',
    verificationLevels: {
      basic: 'QR code only',
      standard: 'QR code + Location',
      enhanced: 'QR code + Location + Biometric',
      maximum: 'All methods required, no fallback',
    },
    endpoints: {
      POST: {
        description: 'Perform unified check-in or check-out',
        body: {
          studentId: 'string (UUID, required)',
          parentId: 'string (UUID, required)',
          sessionType: '"sign_in" | "sign_out" (required)',
          verificationMethods:
            'array of "qr" | "biometric" | "geofence" (required)',
          verificationScore: 'number 0-1 (required)',
          verificationLevel:
            '"basic" | "standard" | "enhanced" | "maximum" (required)',
          location: {
            latitude: 'number (-90 to 90)',
            longitude: 'number (-180 to 180)',
            accuracy: 'number (meters)',
            timestamp: 'number (milliseconds)',
          },
          notes: 'string (optional)',
          qrCodeId: 'string (UUID, optional)',
          biometricCredentialId: 'string (optional)',
        },
      },
    },
  });
}
