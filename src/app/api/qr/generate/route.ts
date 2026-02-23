import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { createClient } from '@supabase/supabase-js';

const schema = z.object({
  teacherId: z.string().uuid(),
  studentId: z.string().uuid(),
  parentId: z.string().uuid(),
});

/**
 * Get today's date string in YYYY-MM-DD format (UTC)
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0] as string;
}

/**
 * Derive a daily secret from the base QR_SECRET
 * This ensures QR codes are only valid for the day they were created
 */
async function deriveDailySecret(
  baseSecret: string,
  dateString: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(baseSecret);
  const dateData = encoder.encode(`daily-qr-secret-${dateString}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const derivedKey = await crypto.subtle.sign('HMAC', cryptoKey, dateData);
  const derivedArray = Array.from(new Uint8Array(derivedKey));
  return btoa(String.fromCharCode(...derivedArray));
}

/**
 * POST /api/qr/generate
 *
 * Generate secure QR code data for teacher authentication
 * Server-side only to protect QR secret
 *
 * SECURITY: Uses daily rotating secret derived from base QR_SECRET
 * QR codes are only valid for the day they are generated
 */
export const POST = withRateLimit({
  keyPrefix: 'api:qr:generate',
  max: 10, // 10 generations per minute
})(async (request: NextRequest) => {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication', code: 'AUTH_INVALID' },
        { status: 401 }
      );
    }

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

    const { teacherId, studentId, parentId } = validation.data;

    // Get secret from server-side environment variable
    const baseSecret = process.env.QR_SECRET;
    if (!baseSecret || baseSecret.length < 32) {
      console.error('QR_SECRET not configured or too short');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Derive daily secret for mandatory daily rotation
    const todayDate = getTodayDateString();
    const dailySecret = await deriveDailySecret(baseSecret, todayDate);

    // Generate signature using daily secret
    const signature = await generateSignature(
      teacherId,
      studentId,
      parentId,
      dailySecret
    );

    // Calculate expiration: end of today (23:59:59 UTC)
    const today = new Date(todayDate);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Create QR code data with expiration
    const data = {
      type: 'teacher_auth',
      teacherId,
      studentId,
      parentId,
      timestamp: Date.now(),
      generatedDate: todayDate, // Include generation date for validation
      expiresAt: endOfDay.getTime(), // Expires at end of today (UTC)
      signature,
    };

    return NextResponse.json({
      qrData: JSON.stringify(data),
      expiresAt: data.expiresAt,
      generatedDate: todayDate,
      note: 'QR code valid until end of day (UTC). Daily rotation is mandatory.',
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
});

/**
 * Generate HMAC-SHA256 signature for QR code validation
 */
async function generateSignature(
  teacherId: string,
  studentId: string,
  parentId: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${teacherId}-${studentId}-${parentId}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return btoa(String.fromCharCode(...signatureArray)).slice(0, 32);
}

/**
 * GET /api/qr/generate
 *
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'QR Code Generation API',
    version: '1.0',
    endpoints: {
      POST: {
        description: 'Generate secure QR code data',
        body: {
          teacherId: 'string (UUID, required)',
          studentId: 'string (UUID, required)',
          parentId: 'string (UUID, required)',
        },
      },
    },
  });
}
