import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/services/invitation.service';
import { withRateLimit } from '@/lib/api-security';
import { acceptInvitationSchema } from '@/lib/validation';

/**
 * GET /api/invitations/accept?token=xxx
 * Validate an invitation token and return teacher details
 */
export const GET = withRateLimit({
  keyPrefix: 'api:invitations:validate',
  max: 20,
})(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', code: 'TOKEN_REQUIRED' },
        { status: 400 }
      );
    }

    // Get invitation
    const invitation = await InvitationService.getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation', code: 'INVALID_TOKEN' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Invitation is ${invitation.status}`,
          code: 'INVITATION_NOT_PENDING',
        },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired', code: 'INVITATION_EXPIRED' },
        { status: 410 } // 410 Gone
      );
    }

    // Return invitation details (no sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
      },
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
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

/**
 * POST /api/invitations/accept
 * Accept an invitation and create teacher account
 */
export const POST = withRateLimit({
  keyPrefix: 'api:invitations:accept',
  max: 5, // 5 attempts per minute (prevent brute force)
})(async (request: NextRequest) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = acceptInvitationSchema.safeParse(body);

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

    const { token, password } = validation.data;

    // Accept invitation (creates auth user, updates teacher record)
    const result = await InvitationService.acceptInvitation(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: 'ACCEPT_FAILED' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: result.userId,
        },
        message: 'Invitation accepted successfully. You can now log in.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);
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
