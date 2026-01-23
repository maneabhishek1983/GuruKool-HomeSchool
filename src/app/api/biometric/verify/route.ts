import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  getWebAuthnService,
  getChallenge,
  deleteChallenge,
} from '@/services/webauthn.service';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

// Type for biometric credential (not in generated Supabase types yet)
interface BiometricCredential {
  id: string;
  teacher_id: string;
  credential_id: string;
  public_key: string;
  device_name: string;
  device_type: string;
  counter: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  transports?: string | null;
}

// New schema for proper WebAuthn verification
const schema = z.object({
  teacherId: z.string().uuid(),
  challengeId: z.string().min(1),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      authenticatorData: z.string(),
      clientDataJSON: z.string(),
      signature: z.string(),
      userHandle: z.string().optional().nullable(),
    }),
    authenticatorAttachment: z.string().optional().nullable(),
    clientExtensionResults: z.object({}).passthrough(),
    type: z.literal('public-key'),
  }),
});

// Legacy schema for backwards compatibility
const legacySchema = z.object({
  teacherId: z.string().uuid(),
  credentialId: z.string().min(1),
  signature: z.string().min(1),
  authenticatorData: z.string().min(1),
  clientDataJSON: z.string().min(1),
});

/**
 * POST /api/biometric/verify
 *
 * Verify a biometric authentication using @simplewebauthn/server
 * Supports both new proper WebAuthn format and legacy format for backwards compatibility
 */
export const POST = withRateLimit({
  keyPrefix: 'api:biometric:verify',
  max: 60, // 60 verifications per minute
})(
  requireTeacher(async (request: NextRequest, user) => {
    try {
      const body = await request.json();

      // Try new schema first
      const newValidation = schema.safeParse(body);

      if (newValidation.success) {
        return handleNewVerification(newValidation.data, user.id);
      }

      // Fall back to legacy schema for backwards compatibility
      const legacyValidation = legacySchema.safeParse(body);

      if (legacyValidation.success) {
        return handleLegacyVerification(legacyValidation.data, user.id);
      }

      // Neither schema matched
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: {
            new: newValidation.error.flatten().fieldErrors,
            legacy: legacyValidation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
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
 * Handle new proper WebAuthn verification
 */
async function handleNewVerification(
  data: z.infer<typeof schema>,
  userId: string
): Promise<NextResponse> {
  const { teacherId, challengeId, response } = data;

  // Verify teacher ID matches authenticated user
  if (teacherId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get stored challenge
  const storedChallenge = getChallenge(challengeId);

  if (!storedChallenge) {
    return NextResponse.json(
      { error: 'Challenge expired or invalid' },
      { status: 400 }
    );
  }

  if (storedChallenge.userId !== teacherId) {
    return NextResponse.json(
      { error: 'Challenge does not match user' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Fetch credential from database
  const { data: credential, error: fetchError } = (await supabase
    .from('teacher_biometric_credentials')
    .select('*')
    .eq('credential_id', response.id)
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .single()) as { data: BiometricCredential | null; error: Error | null };

  if (fetchError || !credential) {
    return NextResponse.json(
      { error: 'Biometric credential not found or inactive' },
      { status: 404 }
    );
  }

  // Verify using @simplewebauthn/server
  const webauthnService = getWebAuthnService();

  // Parse stored transports
  let transports: AuthenticatorTransportFuture[] | undefined;
  if (credential.transports) {
    try {
      transports = JSON.parse(
        credential.transports
      ) as AuthenticatorTransportFuture[];
    } catch {
      transports = undefined;
    }
  }

  const verification = await webauthnService.verifyAuthenticationResponse({
    response: response as AuthenticationResponseJSON,
    expectedChallenge: storedChallenge.challenge,
    credential: {
      credentialId: credential.credential_id,
      credentialPublicKey: credential.public_key,
      counter: credential.counter,
      transports,
    },
  });

  // Clean up used challenge
  deleteChallenge(challengeId);

  if (!verification.verified) {
    return NextResponse.json(
      { error: verification.error || 'Biometric verification failed' },
      { status: 401 }
    );
  }

  // Update credential counter and last_used_at
  const { error: updateError } = await supabase
    .from('teacher_biometric_credentials')
    .update({
      last_used_at: new Date().toISOString(),
      counter: verification.newCounter ?? credential.counter + 1,
    })
    .eq('id', credential.id);

  if (updateError) {
    console.error('Error updating credential counter:', updateError);
    // Don't fail the verification if counter update fails
  }

  return NextResponse.json({
    verified: true,
    credentialId: credential.credential_id,
    deviceName: credential.device_name,
    message: 'Biometric authentication successful',
  });
}

/**
 * Handle legacy verification format (backwards compatibility)
 *
 * Note: This is a simplified verification for backward compatibility.
 * New implementations should use the proper WebAuthn format.
 */
async function handleLegacyVerification(
  data: z.infer<typeof legacySchema>,
  userId: string
): Promise<NextResponse> {
  const {
    teacherId,
    credentialId,
    signature,
    authenticatorData,
    clientDataJSON,
  } = data;

  // Verify teacher ID matches authenticated user
  if (teacherId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch credential from database
  const { data: credential, error: fetchError } = (await supabase
    .from('teacher_biometric_credentials')
    .select('*')
    .eq('credential_id', credentialId)
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .single()) as { data: BiometricCredential | null; error: Error | null };

  if (fetchError || !credential) {
    return NextResponse.json(
      { error: 'Biometric credential not found or inactive' },
      { status: 404 }
    );
  }

  // Basic validation: ensure signature and data are not empty
  if (!signature || !authenticatorData || !clientDataJSON) {
    return NextResponse.json(
      { error: 'Invalid biometric data' },
      { status: 400 }
    );
  }

  // Note: Legacy verification does not perform cryptographic signature verification.
  // This is maintained for backwards compatibility but should be migrated to
  // the new proper WebAuthn verification format.
  console.warn(
    'Legacy biometric verification used. Consider migrating to proper WebAuthn format.'
  );

  // Update credential usage
  const { error: updateError } = await supabase
    .from('teacher_biometric_credentials')
    .update({
      last_used_at: new Date().toISOString(),
      counter: credential.counter + 1,
    })
    .eq('id', credential.id);

  if (updateError) {
    console.error('Error updating credential:', updateError);
  }

  return NextResponse.json({
    verified: true,
    credentialId: credential.credential_id,
    deviceName: credential.device_name,
    message: 'Biometric authentication successful (legacy)',
    warning: 'Please update to new WebAuthn format for enhanced security',
  });
}

/**
 * GET /api/biometric/verify
 *
 * API documentation endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Biometric Verification API',
    version: '2.0',
    features: [
      'Proper WebAuthn signature verification using @simplewebauthn/server',
      'Challenge-based authentication',
      'Counter validation for replay attack prevention',
      'Backwards compatibility with legacy format',
    ],
    endpoints: {
      POST: {
        description: 'Verify biometric authentication',
        formats: {
          recommended: {
            teacherId: 'string (UUID)',
            challengeId: 'string (from /api/biometric/challenge)',
            response: 'AuthenticationResponseJSON from WebAuthn API',
          },
          legacy: {
            teacherId: 'string (UUID)',
            credentialId: 'string',
            signature: 'string (base64)',
            authenticatorData: 'string (base64)',
            clientDataJSON: 'string (base64)',
            note: 'Legacy format - consider migrating to recommended format',
          },
        },
      },
    },
  });
}
