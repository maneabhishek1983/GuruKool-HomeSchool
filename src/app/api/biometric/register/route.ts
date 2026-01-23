import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const schema = z.object({
  teacherId: z.string().uuid(),
  credentialId: z.string().min(1),
  publicKey: z.string().min(1),
  deviceName: z.string().optional(),
  deviceType: z.enum(['ios', 'android', 'web', 'other']).optional(),
});

/**
 * POST /api/biometric/register
 * 
 * Register a new biometric credential for a teacher
 */
export const POST = withRateLimit({
  keyPrefix: 'api:biometric:register',
  max: 10, // 10 registrations per minute (should be rare)
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

      const { teacherId, credentialId, publicKey, deviceName, deviceType } = validation.data;

      // Verify teacher ID matches authenticated user
      if (teacherId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      const supabase = getSupabaseAdmin();

      // Check if credential already exists
      const { data: existing } = await supabase
        .from('teacher_biometric_credentials')
        .select('id')
        .eq('credential_id', credentialId)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'This device is already registered' },
          { status: 409 }
        );
      }

      // Check if teacher already has 5+ credentials (limit to prevent abuse)
      const { data: credentials, error: countError } = await supabase
        .from('teacher_biometric_credentials')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (countError) {
        console.error('Error counting credentials:', countError);
        return NextResponse.json(
          { error: 'Failed to check existing credentials' },
          { status: 500 }
        );
      }

      if (credentials && credentials.length >= 5) {
        return NextResponse.json(
          {
            error: 'Maximum of 5 devices allowed. Please remove an old device first.',
          },
          { status: 400 }
        );
      }

      // Insert new credential
      const { data: newCredential, error: insertError } = await supabase
        .from('teacher_biometric_credentials')
        .insert({
          teacher_id: teacherId,
          credential_id: credentialId,
          public_key: publicKey,
          device_name: deviceName || 'Unknown Device',
          device_type: deviceType || 'other',
          counter: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !newCredential) {
        console.error('Error inserting credential:', insertError);
        return NextResponse.json(
          { error: 'Failed to register biometric credential' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        credentialId: (newCredential as any).credential_id,
        deviceName: (newCredential as any).device_name,
        message: 'Biometric credential registered successfully',
      });
    } catch (error) {
      console.error('Biometric registration error:', error);
      return NextResponse.json(
        { error: 'Failed to register biometric credential' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/biometric/register
 * 
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Biometric Registration API',
    version: '1.0',
    endpoints: {
      POST: {
        description: 'Register a new biometric credential',
        body: {
          teacherId: 'string (UUID, required)',
          credentialId: 'string (required)',
          publicKey: 'string (required, base64 encoded)',
          deviceName: 'string (optional)',
          deviceType: 'string (optional, "ios" | "android" | "web" | "other")',
        },
      },
    },
  });
}
