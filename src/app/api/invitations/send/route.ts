import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { InvitationService } from '@/services/invitation.service';
import { withRateLimit } from '@/lib/api-security';
import { z } from 'zod';

// Validation schema
const sendInvitationSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  resend: z.boolean().optional().default(false),
});

/**
 * POST /api/invitations/send
 * Send (or resend) a teacher invitation email
 */
export const POST = withRateLimit({
  keyPrefix: 'api:invitations:send',
  max: 10, // 10 invitations per minute
})(async (request: NextRequest) => {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication', code: 'AUTH_INVALID' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = sendInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { teacherId, resend } = validation.data;

    // Get teacher and verify ownership
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .eq('parent_id', user.id) // Ensure parent owns this teacher
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if teacher already has a user_id (already accepted invitation)
    if (teacher.user_id) {
      return NextResponse.json(
        {
          error: 'Teacher has already accepted invitation',
          code: 'ALREADY_ACCEPTED',
        },
        { status: 400 }
      );
    }

    // Get parent details for email
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (parentError || !parent) {
      return NextResponse.json(
        { error: 'Parent not found', code: 'PARENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create or resend invitation
    const invitation = resend
      ? await InvitationService.resendInvitation(teacherId, user.id)
      : await InvitationService.createInvitationToken({
          teacher_id: teacherId,
          parent_id: user.id,
          teacher_email: teacher.email,
          teacher_name: teacher.name,
          parent_name: parent.name,
        });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Failed to create invitation', code: 'INVITATION_FAILED' },
        { status: 500 }
      );
    }

    // Generate invitation URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get('origin') ||
      'http://localhost:3000';
    const invitationUrl = InvitationService.generateInvitationUrl(
      invitation.token,
      baseUrl
    );

    // TODO: Send email with invitation URL
    // For now, return the URL so it can be sent manually or displayed in UI
    // In production, integrate with email service (SendGrid, AWS SES, etc.)

    console.log('Teacher Invitation Created:');
    console.log('  Teacher:', teacher.name, `(${teacher.email})`);
    console.log('  Parent:', parent.name);
    console.log('  Invitation URL:', invitationUrl);
    console.log('  Expires:', new Date(invitation.expires_at).toLocaleString());

    return NextResponse.json(
      {
        success: true,
        data: {
          invitationId: invitation.id,
          invitationUrl,
          expiresAt: invitation.expires_at,
          teacherEmail: teacher.email,
          teacherName: teacher.name,
        },
        message: resend
          ? 'Invitation resent successfully'
          : 'Invitation sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
