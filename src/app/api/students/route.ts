import { NextRequest, NextResponse } from 'next/server';
import { createStudentSchema, updateStudentSchema, paginationSchema, validateQueryParams } from '@/lib/validation';
import { DatabaseService } from '@/services/database.service';
import { withRedisRateLimit } from '@/lib/rate-limit-redis';
import { withAuth, requireParentOrAdmin } from '@/lib/auth-middleware';

/**
 * GET /api/students
 * Fetch all students for authenticated parent
 * 
 * Auth: Requires parent or admin role
 * Rate Limit: 100 requests per 15 minutes
 */
export const GET = withRedisRateLimit({
  keyPrefix: 'api:students:get',
  max: 100,
  windowMs: 15 * 60 * 1000,
})(
  requireParentOrAdmin(async (request, { user, supabase }) => {
    try {
      // Validate query parameters
      const params = validateQueryParams(request, paginationSchema);

      // Fetch students for this parent (admins can see all)
      const students = await DatabaseService.getStudents(user.id);

      // Apply pagination
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const paginatedStudents = students.slice(start, end);

      return NextResponse.json({
        success: true,
        data: paginatedStudents,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: students.length,
          totalPages: Math.ceil(students.length / params.limit),
        },
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  })
);

/**
 * POST /api/students
 * Create a new student for authenticated parent
 * 
 * Auth: Requires parent or admin role
 * Rate Limit: 20 requests per 15 minutes
 */
export const POST = withRedisRateLimit({
  keyPrefix: 'api:students:create',
  max: 20,
  windowMs: 15 * 60 * 1000,
})(
  requireParentOrAdmin(async (request, { user }) => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const validatedData = createStudentSchema.parse(body);

      // Create student
      const student = await DatabaseService.createStudent(validatedData, user.id);

      if (!student) {
        return NextResponse.json(
          { error: 'Failed to create student', code: 'CREATE_FAILED' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: student,
          message: 'Student created successfully',
        },
        { status: 201 }
      );
    } catch (error) {
      // Handle validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: (error as any).errors,
          },
          { status: 400 }
        );
      }

      console.error('Error creating student:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  })
);
