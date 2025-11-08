import { NextRequest, NextResponse } from 'next/server';
import { createSessionSchema, paginationSchema } from '@/lib/validation';
import { withRateLimit } from '@/lib/api-security';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/sessions
 * Fetch sessions for authenticated parent with filtering
 */
export const GET = withRateLimit({
  keyPrefix: 'api:sessions:get',
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
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    // Build query
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('parent_id', user.id)
      .order('scheduled_start', { ascending: false });

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate && endDate) {
      query = query
        .gte('scheduled_start', startDate)
        .lte('scheduled_start', endDate);
    }

    // Execute query with pagination
    const start = (page - 1) * limit;
    const {
      data: sessions,
      error,
      count,
    } = await query.range(start, start + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sessions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/sessions
 * Create a new session for authenticated parent
 */
export const POST = withRateLimit({
  keyPrefix: 'api:sessions:create',
  max: 30, // 30 creates per minute
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
    const validation = createSessionSchema.safeParse(body);

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

    // Verify parent owns the student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', validation.data.student_id)
      .eq('parent_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found or unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Create session
    const { data: session, error: createError } = await supabase
      .from('sessions')
      .insert({
        ...validation.data,
        parent_id: user.id,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Create session error:', createError);
      return NextResponse.json(
        { error: 'Failed to create session', code: 'CREATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: session,
        message: 'Session created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
