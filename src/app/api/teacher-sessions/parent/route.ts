import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client for bypassing RLS
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication', code: 'AUTH_INVALID' },
        { status: 401 }
      );
    }

    // Get parent ID from query params
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json(
        { error: 'parentId is required' },
        { status: 400 }
      );
    }

    // Verify the authenticated user is requesting their own data
    if (user.id !== parentId) {
      // Check if user is admin
      const adminClient = getAdminClient();
      const { data: userData } = await adminClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if ((userData as any)?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: can only access your own sessions' },
          { status: 403 }
        );
      }
    }

    const supabase = getAdminClient();
    const sessions: any[] = [];

    // Query teacher_sessions for this parent
    const { data: teacherSessions, error: sessionsError } = await supabase
      .from('teacher_sessions')
      .select('*')
      .eq('parent_id', parentId)
      .order('session_start', { ascending: false });

    if (sessionsError) {
      console.error('Error querying teacher_sessions:', sessionsError);
    }

    if (teacherSessions) {
      // Convert to TimesheetEntry format
      const converted = teacherSessions.map((session: any) => ({
        id: session.id,
        teacher_id: session.teacher_id,
        student_id: session.student_id,
        parent_id: session.parent_id,
        check_in_time: session.session_start,
        check_out_time: session.session_end,
        duration_minutes: session.duration_minutes,
        location: session.location,
        notes: session.notes,
        qr_code_id: session.qr_code_used || '',
        status: session.session_end ? 'checked_out' : 'checked_in',
        created_at: session.created_at,
        updated_at: session.updated_at,
      }));
      sessions.push(...converted);
    }

    // Also query timesheet_entries for this parent (legacy/synced entries)
    const { data: timesheetEntries, error: timesheetError } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('parent_id', parentId)
      .order('check_in_time', { ascending: false });

    if (timesheetError) {
      console.error('Error querying timesheet_entries:', timesheetError);
    }

    if (timesheetEntries) {
      sessions.push(...timesheetEntries);
    }

    // Deduplicate by ID and sort by check-in time
    const seen = new Set<string>();
    const deduplicated = sessions.filter((s) => {
      if (seen.has(s.id)) {
        return false;
      }
      seen.add(s.id);
      return true;
    });

    deduplicated.sort(
      (a, b) =>
        new Date(b.check_in_time).getTime() -
        new Date(a.check_in_time).getTime()
    );

    return NextResponse.json({ sessions: deduplicated });
  } catch (error) {
    console.error('Error fetching parent sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
