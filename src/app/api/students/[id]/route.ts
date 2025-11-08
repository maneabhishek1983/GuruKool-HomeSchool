import { NextRequest, NextResponse } from 'next/server';
import { updateStudentSchema } from '@/lib/validation';
import { DatabaseService } from '@/services/database.service';
import { withRateLimit } from '@/lib/api-security';
import { createClient } from '@supabase/supabase-js';
import { StudentProfile } from '@/types';

/**
 * GET /api/students/[id]
 * Fetch a single student by ID
 */
export const GET = withRateLimit({
  keyPrefix: 'api:students:get-one',
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
        { error: 'Student ID is required', code: 'INVALID_REQUEST' },
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

    // Fetch all students for this parent
    const students = await DatabaseService.getStudents(user.id);
    const student = students.find(s => s.id === id);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/students/[id]
 * Update a student by ID
 */
export const PUT = withRateLimit({
  keyPrefix: 'api:students:update',
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
        { error: 'Student ID is required', code: 'INVALID_REQUEST' },
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
    const validation = updateStudentSchema.safeParse(body);

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

    // Update student - filter out undefined values for exactOptionalPropertyTypes
    const updates: Partial<StudentProfile> = {};
    Object.entries(validation.data).forEach(([key, value]) => {
      if (value !== undefined) {
        (updates as any)[key] = value;
      }
    });
    const updatedStudent = await DatabaseService.updateStudent(id, updates);

    if (!updatedStudent) {
      return NextResponse.json(
        { error: 'Student not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: 'Student updated successfully',
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/students/[id]
 * Delete a student by ID
 */
export const DELETE = withRateLimit({
  keyPrefix: 'api:students:delete',
  max: 20,
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
        { error: 'Student ID is required', code: 'INVALID_REQUEST' },
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

    // Delete student
    const deleted = await DatabaseService.deleteStudent(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Student not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
