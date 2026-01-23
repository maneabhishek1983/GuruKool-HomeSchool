import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const schema = z.object({
  credentialId: z.string().min(1),
});

/**
 * POST /api/biometric/revoke
 * 
 * Revoke (deactivate) a biometric credential
 */
export const POST = withRateLimit({
  keyPrefix: 'api:biometric:revoke',
  max: 10, // 10 revocations per minute
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

      const { credentialId } = validation.data;

      const supabase = getSupabaseAdmin();

      // Verify credential belongs to the authenticated teacher
      const { data: credential, error: fetchError } = await supabase
        .from('teacher_biometric_credentials')
        .select('teacher_id')
        .eq('credential_id', credentialId)
        .single();

      if (fetchError || !credential) {
        return NextResponse.json(
          { error: 'Credential not found' },
          { status: 404 }
        );
      }

      if ((credential as any).teacher_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Deactivate the credential (soft delete)
      const { error: updateError } = await supabase
        .from('teacher_biometric_credentials')
        .update({ is_active: false })
        .eq('credential_id', credentialId);

      if (updateError) {
        console.error('Error revoking credential:', updateError);
        return NextResponse.json(
          { error: 'Failed to revoke credential' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Biometric credential revoked successfully',
      });
    } catch (error) {
      console.error('Credential revocation error:', error);
      return NextResponse.json(
        { error: 'Failed to revoke credential' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/biometric/revoke
 * 
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Biometric Revocation API',
    version: '1.0',
    endpoints: {
      POST: {
        description: 'Revoke a biometric credential',
        body: {
          credentialId: 'string (required)',
        },
      },
    },
  });
}
