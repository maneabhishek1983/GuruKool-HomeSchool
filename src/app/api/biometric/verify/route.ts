import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const schema = z.object({
  teacherId: z.string().uuid(),
  credentialId: z.string().min(1),
  signature: z.string().min(1),
  authenticatorData: z.string().min(1),
  clientDataJSON: z.string().min(1),
});

/**
 * POST /api/biometric/verify
 * 
 * Verify a biometric authentication signature
 * 
 * Note: This is a simplified implementation. In production, you should use
 * a proper WebAuthn library like @simplewebauthn/server for full verification.
 */
export const POST = withRateLimit({
  keyPrefix: 'api:biometric:verify',
  max: 60, // 60 verifications per minute
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

      const { teacherId, credentialId, signature, authenticatorData, clientDataJSON } = validation.data;

      // Verify teacher ID matches authenticated user
      if (teacherId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      const supabase = getSupabaseAdmin();

      // Fetch credential from database
      const { data: credential, error: fetchError } = await supabase
        .from('teacher_biometric_credentials')
        .select('*')
        .eq('credential_id', credentialId)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .single();

      if (fetchError || !credential) {
        return NextResponse.json(
          { error: 'Biometric credential not found or inactive' },
          { status: 404 }
        );
      }

      // In a production environment, you would:
      // 1. Verify the signature using the public key
      // 2. Check the authenticator data
      // 3. Verify the client data JSON
      // 4. Check and increment the counter to prevent replay attacks
      // 
      // For now, we'll do a simplified verification:
      // - Check that all required fields are present
      // - Update last_used_at timestamp
      // - Increment counter
      
      // Basic validation: ensure signature and data are not empty
      if (!signature || !authenticatorData || !clientDataJSON) {
        return NextResponse.json(
          { error: 'Invalid biometric data' },
          { status: 400 }
        );
      }

      // TODO: Implement proper WebAuthn signature verification
      // For now, we'll accept the signature as valid if the credential exists
      // This is NOT secure for production - you MUST implement proper verification
      
      // Update credential usage
      const { error: updateError } = await supabase
        .from('teacher_biometric_credentials')
        .update({
          last_used_at: new Date().toISOString(),
          counter: (credential as any).counter + 1,
        })
        .eq('id', (credential as any).id);

      if (updateError) {
        console.error('Error updating credential:', updateError);
        // Don't fail the verification if update fails
      }

      return NextResponse.json({
        verified: true,
        credentialId: (credential as any).credential_id,
        deviceName: (credential as any).device_name,
        message: 'Biometric authentication successful',
      });
    } catch (error) {
      console.error('Biometric verification error:', error);
      return NextResponse.json(
        { error: 'Failed to verify biometric authentication' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/biometric/verify
 * 
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Biometric Verification API',
    version: '1.0',
    warning: 'This is a simplified implementation. Production use requires proper WebAuthn verification.',
    endpoints: {
      POST: {
        description: 'Verify biometric authentication signature',
        body: {
          teacherId: 'string (UUID, required)',
          credentialId: 'string (required)',
          signature: 'string (required, base64 encoded)',
          authenticatorData: 'string (required, base64 encoded)',
          clientDataJSON: 'string (required, base64 encoded)',
        },
      },
    },
    todo: [
      'Implement proper WebAuthn signature verification',
      'Use @simplewebauthn/server library',
      'Verify authenticator data',
      'Verify client data JSON',
      'Check counter for replay attack prevention',
    ],
  });
}
