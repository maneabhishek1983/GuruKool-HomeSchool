import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';

const schema = z.object({
  qrData: z.string().min(10),
});

/**
 * POST /api/qr/validate
 * 
 * Validate QR code signature and expiration
 * Server-side only to protect QR secret
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
        { error: 'QR code has expired. Please request a new one from the parent.' },
        { status: 401 }
      );
    }

    // Verify signature
    const secret = process.env.QR_SECRET;
    if (!secret || secret.length < 32) {
      console.error('QR_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const expectedSignature = await generateSignature(
      parsedData.teacherId,
      parsedData.studentId,
      parsedData.parentId,
      secret
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
