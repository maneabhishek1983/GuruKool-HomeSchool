import { NextRequest, NextResponse } from 'next/server';
import { updateTeacherSchema } from '@/lib/validation';
import { DatabaseService } from '@/services/database.service';
import { withRateLimit } from '@/lib/api-security';
import { createClient } from '@supabase/supabase-js';
import { TeacherProfile } from '@/types';

/**
 * GET /api/teachers/[id]
 * Fetch a single teacher by ID
 */
export const GET = withRateLimit({
  keyPrefix: 'api:teachers:get-one',
  max: 100,
})(async (
  request: NextRequest,
  context?: {
    params?: Record<string, string> | Promise<Record<string, string>>;
  }
) => {
  try {
    const params = await Promise.resolve(context?.params || {});
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Teacher ID is required', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

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

    // Fetch all teachers for this parent
    const teachers = await DatabaseService.getTeachers(user.id);
    const teacher = teachers.find(t => t.id === id);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/teachers/[id]
 * Update a teacher by ID
 */
export const PUT = withRateLimit({
  keyPrefix: 'api:teachers:update',
  max: 50,
})(async (
  request: NextRequest,
  context?: {
    params?: Record<string, string> | Promise<Record<string, string>>;
  }
) => {
  try {
    const params = await Promise.resolve(context?.params || {});
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Teacher ID is required', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

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
    const validation = updateTeacherSchema.safeParse(body);

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

    // Update teacher - filter out undefined values for exactOptionalPropertyTypes
    const updates: Partial<TeacherProfile> = {};
    Object.entries(validation.data).forEach(([key, value]) => {
      if (value !== undefined) {
        (updates as any)[key] = value;
      }
    });
    const updatedTeacher = await DatabaseService.updateTeacher(id, updates);

    if (!updatedTeacher) {
      return NextResponse.json(
        { error: 'Teacher not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTeacher,
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
