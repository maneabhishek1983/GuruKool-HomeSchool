import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';

const schema = z.object({
  qrData: z.string().min(10),
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
 * POST /api/qr/validate
 *
 * Validate QR code signature and expiration
 * Server-side only to protect QR secret
 *
 * SECURITY: Uses daily rotating secret derived from base QR_SECRET
 * QR codes are only valid for the day they were generated
 */
export const POST = withRateLimit({
  keyPrefix: 'api:qr:validate',
  max: 30, // 30 validations per minute
})(async (request: NextRequest) => {
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

    const { qrData } = validation.data;

    // Parse QR code data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    // Check QR code type
    if (parsedData.type !== 'teacher_auth') {
      return NextResponse.json(
        { error: 'Invalid QR code type' },
        { status: 400 }
      );
    }

    // Check expiration
    if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
      return NextResponse.json(
        {
          error:
            'QR code has expired. Daily rotation requires a fresh code each day.',
        },
        { status: 401 }
      );
    }

    // Verify signature with daily secret rotation
    const baseSecret = process.env.QR_SECRET;
    if (!baseSecret || baseSecret.length < 32) {
      console.error('QR_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the generation date from QR data, or use today as fallback for legacy codes
    const generatedDate = parsedData.generatedDate || getTodayDateString();

    // Verify the QR was generated today (mandatory daily rotation)
    const today = getTodayDateString();
    if (generatedDate !== today) {
      return NextResponse.json(
        {
          error: `QR code was generated on ${generatedDate} but today is ${today}. Daily rotation requires a fresh code each day.`,
          generatedDate,
          currentDate: today,
        },
        { status: 401 }
      );
    }

    // Derive the daily secret for the generation date
    const dailySecret = await deriveDailySecret(baseSecret, generatedDate);

    const expectedSignature = await generateSignature(
      parsedData.teacherId,
      parsedData.studentId,
      parsedData.parentId,
      dailySecret
    );

    if (parsedData.signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid QR code signature' },
        { status: 401 }
      );
    }

    // QR code is valid
    return NextResponse.json({
      valid: true,
      data: {
        teacherId: parsedData.teacherId,
        studentId: parsedData.studentId,
        parentId: parsedData.parentId,
        expiresAt: parsedData.expiresAt,
        generatedDate,
      },
    });
  } catch (error) {
    console.error('Error validating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to validate QR code' },
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
