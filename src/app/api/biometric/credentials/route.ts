import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api-security';
import { requireTeacher } from '@/lib/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * GET /api/biometric/credentials
 * 
 * List all biometric credentials for the authenticated teacher
 */
export const GET = withRateLimit({
  keyPrefix: 'api:biometric:credentials',
  max: 30, // 30 requests per minute
})(
  requireTeacher(async (request: NextRequest, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const teacherId = searchParams.get('teacherId');

      // Verify teacher ID matches authenticated user
      if (teacherId && teacherId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      const supabase = getSupabaseAdmin();

      // Fetch all credentials for the teacher
      const { data: credentials, error } = await supabase
        .from('teacher_biometric_credentials')
        .select('id, credential_id, device_name, device_type, created_at, last_used_at, is_active')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credentials:', error);
        return NextResponse.json(
          { error: 'Failed to fetch credentials' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        credentials: credentials || [],
        count: credentials?.length || 0,
      });
    } catch (error) {
      console.error('Error listing credentials:', error);
      return NextResponse.json(
        { error: 'Failed to list credentials' },
        { status: 500 }
      );
    }
  })
);
