import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/api-security';
import { requireParent } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const schema = z.object({
  exceptionId: z.string().uuid(),
  approved: z.boolean(),
  denialReason: z.string().optional(),
});

/**
 * POST /api/geofence/exception/approve
 * 
 * Approve or deny a geofence exception request (parent only)
 */
export const POST = withRateLimit({
  keyPrefix: 'api:geofence:exception:approve',
  max: 20, // 20 requests per minute
})(
  requireParent(async (request: NextRequest, user) => {
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

      const { exceptionId, approved, denialReason } = validation.data;

      const supabase = getSupabaseAdmin();

      // Verify exception exists and belongs to parent's student
      const { data: exception, error: fetchError } = await supabase
        .from('geofence_exceptions')
        .select('*, students(parent_id)')
        .eq('id', exceptionId)
        .single();

      if (fetchError || !exception) {
        return NextResponse.json(
          { error: 'Exception request not found' },
          { status: 404 }
        );
      }

      if (exception.students.parent_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      if (exception.status !== 'pending') {
        return NextResponse.json(
          { error: `Exception already ${exception.status}` },
          { status: 400 }
        );
      }

      // Update exception status
      const { data: updated, error: updateError } = await supabase
        .from('geofence_exceptions')
        .update({
          status: approved ? 'approved' : 'denied',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          denial_reason: approved ? null : denialReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exceptionId)
        .select()
        .single();

      if (updateError || !updated) {
        console.error('Error updating exception:', updateError);
        return NextResponse.json(
          { error: 'Failed to update exception request' },
          { status: 500 }
        );
      }

      // TODO: Send notification to teacher
      // This would integrate with your notification system

      return NextResponse.json({
        success: true,
        exceptionId: updated.id,
        status: updated.status,
        message: approved
          ? 'Exception request approved'
          : 'Exception request denied',
      });
    } catch (error) {
      console.error('Exception approval error:', error);
      return NextResponse.json(
        { error: 'Failed to process exception request' },
        { status: 500 }
      );
    }
  })
);

/**
 * GET /api/geofence/exception/approve
 * 
 * List exception requests for the authenticated parent
 */
export const GET = withRateLimit({
  keyPrefix: 'api:geofence:exception:approve:list',
  max: 30, // 30 requests per minute
})(
  requireParent(async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');

      const supabase = getSupabaseAdmin();

      let query = supabase
        .from('geofence_exceptions')
        .select('*, students(name), teachers(user_id, users(email))')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: exceptions, error } = await query;

      if (error) {
        console.error('Error fetching exceptions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch exception requests' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        exceptions: exceptions || [],
        count: exceptions?.length || 0,
      });
    } catch (error) {
      console.error('Error listing exceptions:', error);
      return NextResponse.json(
        { error: 'Failed to list exception requests' },
        { status: 500 }
      );
    }
  })
);
