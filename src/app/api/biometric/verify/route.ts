import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { WebAuthnService } from '@/services/webauthn.service';
import { verifyChallengeToken } from '@/lib/webauthn-challenge-token';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

const schema = z.object({
  teacherId: z.string().uuid(),
  credentialId: z.string().min(1),
  signature: z.string().min(1),
  authenticatorData: z.string().min(1),
  clientDataJSON: z.string().min(1),
  // Returned by /api/biometric/challenge; binds the response to the issued challenge.
  challengeToken: z.string().min(1),
  userHandle: z.string().optional(),
});

/**
 * POST /api/biometric/verify
 *
 * Verifies a WebAuthn assertion against a previously-issued challenge token.
 *
 * Security properties:
 *   1. Challenge integrity: signed HMAC token bound to userId+action+expiry.
 *   2. Signature verification: @simplewebauthn/server validates the
 *      authenticator's signature against the stored public key, origin, and RP ID.
 *   3. Replay prevention: counter must strictly advance. Update is conditional
 *      on the stored counter still being <= old counter, blocking races.
 */
export const POST = withRateLimit({
  keyPrefix: 'api:biometric:verify',
  max: 60,
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
        teacherId,
        credentialId,
        signature,
        authenticatorData,
        clientDataJSON,
        challengeToken,
        userHandle,
      } = validation.data;

      if (teacherId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // 1. Validate the challenge token and recover the original challenge.
      let verifiedToken;
      try {
        verifiedToken = verifyChallengeToken(challengeToken, {
          userId: user.id,
          action: 'authenticate',
        });
      } catch (err) {
        return NextResponse.json(
          { error: 'Invalid or expired challenge', verified: false },
          { status: 401 }
        );
      }

      const supabase = getSupabaseAdmin();

      // 2. Load the stored credential.
      const { data: credential, error: fetchError } = await supabase
        .from('teacher_biometric_credentials')
        .select(
          'id, credential_id, public_key, counter, device_name, transports'
        )
        .eq('credential_id', credentialId)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .single();

      if (fetchError || !credential) {
        return NextResponse.json(
          {
            error: 'Biometric credential not found or inactive',
            verified: false,
          },
          { status: 404 }
        );
      }

      const storedCounter = (credential as any).counter as number;
      const credPublicKey = (credential as any).public_key as string;
      const transports = (credential as any).transports as
        | string[]
        | null
        | undefined;

      // 3. Reconstruct the AuthenticationResponseJSON and verify the signature.
      const response: AuthenticationResponseJSON = {
        id: credentialId,
        rawId: credentialId,
        type: 'public-key',
        clientExtensionResults: {},
        response: {
          authenticatorData,
          clientDataJSON,
          signature,
          ...(userHandle ? { userHandle } : {}),
        },
      };

      const webauthn = new WebAuthnService();
      const result = await webauthn.verifyAuthenticationResponse({
        response,
        expectedChallenge: verifiedToken.challenge,
        credential: {
          credentialId,
          credentialPublicKey: credPublicKey,
          counter: storedCounter,
          transports: (transports as any) ?? undefined,
        },
      });

      if (!result.verified) {
        return NextResponse.json(
          {
            error: result.error || 'Signature verification failed',
            verified: false,
          },
          { status: 401 }
        );
      }

      // 4. Replay defense: counter must strictly advance, and the update must
      //    only succeed if the stored counter is still what we read.
      const newCounter = result.newCounter ?? storedCounter + 1;
      if (newCounter <= storedCounter) {
        return NextResponse.json(
          {
            error: 'Replay detected (counter did not advance)',
            verified: false,
          },
          { status: 401 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('teacher_biometric_credentials')
        .update({
          counter: newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', (credential as any).id)
        .eq('counter', storedCounter) // optimistic concurrency
        .select('id')
        .single();

      if (updateError || !updated) {
        // Either someone else just advanced the counter (replay) or DB error.
        return NextResponse.json(
          {
            error: 'Counter update conflict — possible concurrent verify',
            verified: false,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        verified: true,
        credentialId,
        deviceName: (credential as any).device_name,
        message: 'Biometric authentication successful',
      });
    } catch (error) {
      console.error('Biometric verification error:', error);
      return NextResponse.json(
        { error: 'Failed to verify biometric authentication', verified: false },
        { status: 500 }
      );
    }
  })
);

export async function GET() {
  return NextResponse.json({
    message: 'Biometric Verification API',
    version: '2.0',
    endpoints: {
      POST: {
        description:
          'Verify a WebAuthn assertion. Requires a challengeToken from /api/biometric/challenge.',
        body: {
          teacherId: 'string (UUID, required)',
          credentialId: 'string (required)',
          signature: 'string (required, base64url)',
          authenticatorData: 'string (required, base64url)',
          clientDataJSON: 'string (required, base64url)',
          challengeToken: 'string (required) — opaque token from /challenge',
          userHandle: 'string (optional, base64url)',
        },
      },
    },
  });
}
