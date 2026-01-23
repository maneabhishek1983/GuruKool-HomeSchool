import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';
import {
  getWebAuthnService,
  storeChallenge,
} from '@/services/webauthn.service';

// Type for credential with transports
interface StoredCredential {
  credential_id: string;
  public_key: string;
  counter: number;
  transports?: string | null;
}

const schema = z.object({
  teacherId: z.string().uuid(),
  action: z.enum(['register', 'authenticate']),
  userName: z.string().optional(),
  userDisplayName: z.string().optional(),
});

/**
 * POST /api/biometric/challenge
 *
 * Generate a WebAuthn challenge for biometric registration or authentication
 * using @simplewebauthn/server
 */
export const POST = withRateLimit({
  keyPrefix: 'api:biometric:challenge',
  max: 30, // 30 requests per minute
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

      const { teacherId, action, userName, userDisplayName } = validation.data;

      // Verify teacher ID matches authenticated user
      if (teacherId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const supabase = getSupabaseAdmin();
      const webauthnService = getWebAuthnService();

      // Generate unique challenge ID for tracking
      const challengeId = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      if (action === 'register') {
        // Get existing credentials to exclude from registration
        const { data: existingCredentials } = (await supabase
          .from('teacher_biometric_credentials')
          .select('credential_id, transports')
          .eq('teacher_id', teacherId)
          .eq('is_active', true)) as {
          data: { credential_id: string; transports?: string | null }[] | null;
        };

        const excludeCredentials =
          existingCredentials?.map(cred => ({
            credentialId: cred.credential_id,
            credentialPublicKey: '', // Not needed for exclusion
            counter: 0,
            transports: cred.transports
              ? JSON.parse(cred.transports)
              : undefined,
          })) || [];

        // Generate registration options using @simplewebauthn/server
        const options = await webauthnService.generateRegistrationOptions({
          userId: teacherId,
          userName: userName || user.email || teacherId,
          userDisplayName: userDisplayName || 'Teacher',
          excludeCredentials,
        });

        // Store challenge for later verification
        storeChallenge({
          challengeId,
          challenge: options.challenge,
          userId: teacherId,
          action: 'register',
        });

        return NextResponse.json({
          challengeId,
          options,
          expiresAt: expiresAt.toISOString(),
        });
      } else {
        // Authenticate: fetch existing credential IDs
        const { data: credentials, error } = (await supabase
          .from('teacher_biometric_credentials')
          .select('credential_id, public_key, counter, transports')
          .eq('teacher_id', teacherId)
          .eq('is_active', true)) as {
          data: StoredCredential[] | null;
          error: unknown;
        };

        if (error) {
          console.error('Error fetching credentials:', error);
          return NextResponse.json(
            { error: 'Failed to fetch credentials' },
            { status: 500 }
          );
        }

        if (!credentials || credentials.length === 0) {
          return NextResponse.json(
            {
              error:
                'No biometric credentials registered. Please register first.',
            },
            { status: 400 }
          );
        }

        // Convert to format expected by webauthn service
        const allowCredentials = credentials.map(cred => ({
          credentialId: cred.credential_id,
          credentialPublicKey: cred.public_key,
          counter: cred.counter,
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        }));

        // Generate authentication options using @simplewebauthn/server
        const options = await webauthnService.generateAuthenticationOptions({
          allowCredentials,
        });

        // Store challenge for later verification
        storeChallenge({
          challengeId,
          challenge: options.challenge,
          userId: teacherId,
          action: 'authenticate',
        });

        // Also include legacy format for backwards compatibility
        const credentialIds = credentials.map(c => c.credential_id);

        return NextResponse.json({
          challengeId,
          options,
          // Legacy fields for backwards compatibility
          challenge: options.challenge,
          credentialIds,
          expiresAt: expiresAt.toISOString(),
        });
      }
    } catch (error) {
      console.error('Challenge generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate challenge' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/biometric/challenge
 *
 * API documentation endpoint
 */
export async function GET() {
  const webauthnService = getWebAuthnService();

  return NextResponse.json({
    message: 'Biometric Challenge API',
    version: '2.0',
    features: [
      'Uses @simplewebauthn/server for proper WebAuthn challenge generation',
      'Challenge-based authentication with 5-minute expiry',
      'Supports both registration and authentication flows',
    ],
    configuration: {
      rpId: webauthnService.getRpId(),
      origin: webauthnService.getOrigin(),
    },
    endpoints: {
      POST: {
        description: 'Generate WebAuthn challenge for biometric authentication',
        body: {
          teacherId: 'string (UUID, required)',
          action: 'string (required, "register" or "authenticate")',
          userName: 'string (optional, for registration)',
          userDisplayName: 'string (optional, for registration)',
        },
        response: {
          registration: {
            challengeId: 'string (use for verification)',
            options: 'PublicKeyCredentialCreationOptions',
            expiresAt: 'ISO timestamp',
          },
          authentication: {
            challengeId: 'string (use for verification)',
            options: 'PublicKeyCredentialRequestOptions',
            challenge: 'string (legacy compatibility)',
            credentialIds: 'string[] (legacy compatibility)',
            expiresAt: 'ISO timestamp',
          },
        },
      },
    },
  });
}
