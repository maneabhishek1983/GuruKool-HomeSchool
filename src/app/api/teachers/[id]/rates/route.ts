import { NextRequest, NextResponse } from 'next/server';
import { teacherRateSchema } from '@/lib/validation';
import { withRateLimit } from '@/lib/api-security';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/teachers/[id]/rates
 * Fetch rates for a specific teacher
 */
export const GET = withRateLimit({
  keyPrefix: 'api:teachers:rates:get',
  max: 100,
})(async (
  request: NextRequest,
  context?: {
    params?: Record<string, string> | Promise<Record<string, string>>;
  }
) => {
  try {
    const params = await Promise.resolve(context?.params || {});
    const teacherId = params.id;
    if (!teacherId) {
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

    // Fetch active rates for this teacher
    const { data: rates, error } = await supabase
      .from('teacher_rates')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('subject', { ascending: true });

    if (error) {
      console.error('Error fetching teacher rates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rates', code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rates || [],
    });
  } catch (error) {
    console.error('Error fetching teacher rates:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/teachers/[id]/rates
 * Create or update rates for a specific teacher (parent only)
 */
export const POST = withRateLimit({
  keyPrefix: 'api:teachers:rates:create',
  max: 20,
})(async (
  request: NextRequest,
  context?: {
    params?: Record<string, string> | Promise<Record<string, string>>;
  }
) => {
  try {
    const params = await Promise.resolve(context?.params || {});
    const teacherId = params.id;
    if (!teacherId) {
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

    // Verify this teacher is assigned to a student of this parent
    const { data: assignments, error: assignmentError } = await supabase
      .from('teacher_assignments')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('parent_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (assignmentError || !assignments || assignments.length === 0) {
      return NextResponse.json(
        {
          error:
            'You can only manage rates for teachers assigned to your students',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = teacherRateSchema.safeParse(body);

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

    const rateData = validation.data;

    // Check if rate already exists for this subject
    const { data: existingRate } = await supabase
      .from('teacher_rates')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('subject', rateData.subject)
      .eq('is_active', true)
      .single();

    if (existingRate) {
      // Deactivate old rate and create new one
      await supabase
        .from('teacher_rates')
        .update({
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', existingRate.id);
    }

    // Create new rate
    const { data: newRate, error: insertError } = await supabase
      .from('teacher_rates')
      .insert({
        teacher_id: teacherId,
        subject: rateData.subject,
        rate_type: rateData.rate_type,
        rate_amount: rateData.rate_amount,
        currency: rateData.currency,
        effective_date:
          rateData.effective_date || new Date().toISOString().split('T')[0],
        notes: rateData.notes,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating teacher rate:', insertError);
      return NextResponse.json(
        { error: 'Failed to create rate', code: 'INSERT_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newRate,
        message: existingRate
          ? 'Rate updated successfully'
          : 'Rate created successfully',
      },
      { status: existingRate ? 200 : 201 }
    );
  } catch (error) {
    console.error('Error creating teacher rate:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/teachers/[id]/rates
 * Bulk update rates for a teacher (replaces all existing rates)
 */
export const PUT = withRateLimit({
  keyPrefix: 'api:teachers:rates:update',
  max: 20,
})(async (
  request: NextRequest,
  context?: {
    params?: Record<string, string> | Promise<Record<string, string>>;
  }
) => {
  try {
    const params = await Promise.resolve(context?.params || {});
    const teacherId = params.id;
    if (!teacherId) {
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

    // Verify this teacher is assigned to a student of this parent
    const { data: assignments, error: assignmentError } = await supabase
      .from('teacher_assignments')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('parent_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (assignmentError || !assignments || assignments.length === 0) {
      return NextResponse.json(
        {
          error:
            'You can only manage rates for teachers assigned to your students',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    if (!Array.isArray(body.rates)) {
      return NextResponse.json(
        {
          error: 'Request body must contain a "rates" array',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Validate each rate
    const validatedRates = [];
    for (const rate of body.rates) {
      const validation = teacherRateSchema.safeParse(rate);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed for rate',
            code: 'VALIDATION_ERROR',
            details: validation.error.errors,
            invalidRate: rate,
          },
          { status: 400 }
        );
      }
      validatedRates.push(validation.data);
    }

    // Deactivate all existing rates
    await supabase
      .from('teacher_rates')
      .update({
        is_active: false,
        end_date: new Date().toISOString().split('T')[0],
      })
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    // Insert new rates
    const ratesToInsert = validatedRates.map(rate => ({
      teacher_id: teacherId,
      subject: rate.subject,
      rate_type: rate.rate_type,
      rate_amount: rate.rate_amount,
      currency: rate.currency,
      effective_date:
        rate.effective_date || new Date().toISOString().split('T')[0],
      notes: rate.notes,
      is_active: true,
    }));

    const { data: newRates, error: insertError } = await supabase
      .from('teacher_rates')
      .insert(ratesToInsert)
      .select();

    if (insertError) {
      console.error('Error updating teacher rates:', insertError);
      return NextResponse.json(
        { error: 'Failed to update rates', code: 'INSERT_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newRates,
      message: 'Rates updated successfully',
    });
  } catch (error) {
    console.error('Error updating teacher rates:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
