import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/lib/api-security';
import { teacherSessionScanSchema } from '@/lib/validation';
import { TeacherQRService } from '@/services/teacher-qr.service';

/**
 * POST /api/teacher-sessions/scan
 *
 * Validate scanned QR code and create teacher session
 *
 * Request Body:
 * {
 *   qrData: string,          // QR code data from scanner
 *   sessionType: 'sign_in' | 'sign_out',
 *   location?: { latitude?, longitude?, address? },
 *   notes?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   session: TeacherSession
 * }
 *
 * Errors:
 * - 400: Invalid request body
 * - 401: Invalid or expired QR code
 * - 500: Server error
 */
export const POST = withRateLimit({
  keyPrefix: 'api:teacher-sessions:scan',
  max: 20, // 20 scans per minute
})(async (request: NextRequest) => {
  try {
    // ========== AUTHENTICATION CHECK ==========
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Verify the user with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Server configuration error', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication', code: 'AUTH_INVALID' },
        { status: 401 }
      );
    }

    // Verify user is a teacher (optional: stricter role check)
    // For now, any authenticated user can scan QR codes
    // ========== END AUTHENTICATION CHECK ==========

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validation = teacherSessionScanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { qrData, sessionType, location, notes } = validation.data;

    // Validate QR code and create session
    const session = await TeacherQRService.validateQRCodeAndCreateSession(
      qrData,
      sessionType,
      location,
      notes
    );

    if (!session) {
      return NextResponse.json(
        {
          error: 'Invalid or expired QR code',
          message:
            'The QR code could not be validated. It may be expired, inactive, or invalid.',
        },
        { status: 401 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        session,
        message: `Successfully ${sessionType === 'sign_in' ? 'signed in' : 'signed out'}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error scanning QR code:', error);

    // Return user-friendly error
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process QR code';

    return NextResponse.json(
      {
        error: 'QR scan failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/teacher-sessions/scan
 *
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Teacher QR Code Scanning API',
    version: '1.0',
    endpoints: {
      POST: {
        description: 'Scan QR code and create teacher session',
        body: {
          qrData: 'string (required)',
          sessionType: "'sign_in' | 'sign_out' (required)",
          location: 'object (optional)',
          notes: 'string (optional)',
        },
      },
    },
  });
}
