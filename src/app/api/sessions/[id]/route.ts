import { NextRequest, NextResponse } from 'next/server';
import { updateSessionSchema } from '@/lib/validation';
import { withRateLimit } from '@/lib/api-security';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/sessions/[id]
 * Fetch a single session by ID
 */
export const GET = withRateLimit({
  keyPrefix: 'api:sessions:get-one',
  max: 100,
})(async (request: NextRequest, context?: { params?: Record<string, string> }) => {
  try {
    const id = context?.params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required', code: 'INVALID_REQUEST' },
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

    // Fetch session
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('parent_id', user.id)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/sessions/[id]
 * Update a session by ID
 */
export const PUT = withRateLimit({
  keyPrefix: 'api:sessions:update',
  max: 50,
})(async (request: NextRequest, context?: { params?: Record<string, string> }) => {
  try {
    const id = context?.params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required', code: 'INVALID_REQUEST' },
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
    const validation = updateSessionSchema.safeParse(body);

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

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('parent_id', user.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/sessions/[id]
 * Delete a session by ID
 */
export const DELETE = withRateLimit({
  keyPrefix: 'api:sessions:delete',
  max: 20,
})(async (request: NextRequest, context?: { params?: Record<string, string> }) => {
  try {
    const id = context?.params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required', code: 'INVALID_REQUEST' },
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

    // Delete session
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('parent_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
