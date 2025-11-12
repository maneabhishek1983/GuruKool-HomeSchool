import { NextRequest, NextResponse } from 'next/server';
import { teacherCreateSchema, paginationSchema } from '@/lib/validation';
import { DatabaseService } from '@/services/database.service';
import { InvitationService } from '@/services/invitation.service';
import { withRateLimit } from '@/lib/api-security';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/teachers
 * Fetch all teachers for authenticated parent
 */
export const GET = withRateLimit({
  keyPrefix: 'api:teachers:get',
  max: 100,
})(async (request: NextRequest) => {
  try {
    // Get auth token from header
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
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate pagination
    const paginationResult = paginationSchema.safeParse({ page, limit });
    if (!paginationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid pagination parameters',
          details: paginationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Fetch teachers for this parent
    const teachers = await DatabaseService.getTeachers(user.id);

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedTeachers = teachers.slice(start, end);

    return NextResponse.json({
      success: true,
      data: paginatedTeachers,
      pagination: {
        page,
        limit,
        total: teachers.length,
        totalPages: Math.ceil(teachers.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/teachers
 * Create a new teacher for authenticated parent
 */
export const POST = withRateLimit({
  keyPrefix: 'api:teachers:create',
  max: 10, // 10 creates per minute
})(async (request: NextRequest) => {
  try {
    // Get auth token from header
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
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
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
    const validation = teacherCreateSchema.safeParse(body);

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

    // Create teacher
    const teacher = await DatabaseService.createTeacher(
      validation.data,
      user.id
    );

    if (!teacher) {
      return NextResponse.json(
        { error: 'Failed to create teacher', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }

    // Get parent details for invitation
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    // Create invitation token and send email
    const invitation = await InvitationService.createInvitationToken({
      teacher_id: teacher.id,
      parent_id: user.id,
      teacher_email: teacher.email,
      teacher_name: teacher.name,
      parent_name: parent?.name || 'Parent',
    });

    let invitationUrl = null;
    if (invitation) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        request.headers.get('origin') ||
        'http://localhost:3000';
      invitationUrl = InvitationService.generateInvitationUrl(
        invitation.token,
        baseUrl
      );

      console.log('✉️  Teacher Invitation Created:');
      console.log('   Teacher:', teacher.name, `(${teacher.email})`);
      console.log('   Invitation URL:', invitationUrl);
      console.log(
        '   Expires:',
        new Date(invitation.expires_at).toLocaleString()
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...teacher,
          invitationUrl, // Return URL so parent can share it manually
          invitationSent: !!invitation,
        },
        message: 'Teacher created successfully. Invitation sent.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
