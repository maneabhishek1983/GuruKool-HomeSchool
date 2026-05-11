import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { issueChallengeToken } from '@/lib/webauthn-challenge-token';
import crypto from 'crypto';

const schema = z.object({
  teacherId: z.string().uuid(),
  action: z.enum(['register', 'authenticate']),
});

/**
 * POST /api/biometric/challenge
 *
 * Generate a WebAuthn challenge for biometric registration or authentication
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

      const { teacherId, action } = validation.data;

      // Verify teacher ID matches authenticated user
      if (teacherId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Generate cryptographically secure random challenge
      const challenge = crypto.randomBytes(32).toString('base64');

      // Store challenge in database with expiration (5 minutes)
      const supabase = getSupabaseAdmin();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // For authentication, also fetch existing credential IDs
      let credentialIds: string[] = [];

      if (action === 'authenticate') {
        const { data: credentials, error } = (await supabase
          .from('teacher_biometric_credentials')
          .select('credential_id')
          .eq('teacher_id', teacherId)
          .eq('is_active', true)) as {
          data: { credential_id: string }[] | null;
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

        credentialIds = credentials.map((c: any) => c.credential_id);
      }

      // Issue a stateless HMAC-signed token binding this challenge to the user
      // and action. The client must echo it back at /verify time; the server
      // validates the HMAC and TTL before passing the challenge into
      // @simplewebauthn/server. Replay defense comes from the counter check
      // in /verify, not the token itself.
      const challengeToken = issueChallengeToken({
        challenge,
        userId: user.id,
        action,
      });

      return NextResponse.json({
        challenge,
        challengeToken,
        credentialIds: action === 'authenticate' ? credentialIds : undefined,
        expiresAt: expiresAt.toISOString(),
      });
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
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Biometric Challenge API',
    version: '1.0',
    endpoints: {
      POST: {
        description: 'Generate WebAuthn challenge for biometric authentication',
        body: {
          teacherId: 'string (UUID, required)',
          action: 'string (required, "register" or "authenticate")',
        },
      },
    },
  });
}
