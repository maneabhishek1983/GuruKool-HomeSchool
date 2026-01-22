import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';

const schema = z.object({
  teacherId: z.string().uuid(),
  studentId: z.string().uuid(),
  parentId: z.string().uuid(),
});

/**
 * POST /api/qr/generate
 * 
 * Generate secure QR code data for teacher authentication
 * Server-side only to protect QR secret
 */
export const POST = withRateLimit({
  keyPrefix: 'api:qr:generate',
  max: 10, // 10 generations per minute
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

    const { teacherId, studentId, parentId } = validation.data;

    // Get secret from server-side environment variable
    const secret = process.env.QR_SECRET;
    if (!secret || secret.length < 32) {
      console.error('QR_SECRET not configured or too short');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Generate signature
    const signature = await generateSignature(teacherId, studentId, parentId, secret);

    // Create QR code data with expiration
    const data = {
      type: 'teacher_auth',
      teacherId,
      studentId,
      parentId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      signature,
    };

    return NextResponse.json({ 
      qrData: JSON.stringify(data),
      expiresAt: data.expiresAt,
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
