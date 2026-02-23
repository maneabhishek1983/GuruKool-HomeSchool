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

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify the authenticated user is requesting their own data
    if (user.id !== userId) {
      const adminCheck = getAdminClient();
      const { data: userData } = await adminCheck
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

    // Step 1: Look up teacher record by user_id
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, user_id')
      .eq('user_id', userId)
      .single();

    // Collect all possible teacher IDs to check
    const teacherIdsToCheck: string[] = [userId]; // Always check userId directly
    if (teacher?.id) {
      teacherIdsToCheck.push(teacher.id);
    }

    // Step 2: Query teacher_sessions for active session using all possible IDs
    const { data: sessions, error: sessionsError } = await supabase
      .from('teacher_sessions')
      .select('*')
      .in('teacher_id', teacherIdsToCheck)
      .is('session_end', null)
      .order('session_start', { ascending: false })
      .limit(1);

    if (sessionsError) {
      console.error('Error querying teacher_sessions:', sessionsError);
    }

    if (sessions && sessions.length > 0) {
      // Convert to TimesheetEntry format
      const session = sessions[0];
      const activeSession = {
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
      };

      return NextResponse.json({ activeSession });
    }

    // Step 3: Also check timesheet_entries using all possible IDs
    const { data: timesheetEntries } = await supabase
      .from('timesheet_entries')
      .select('*')
      .in('teacher_id', teacherIdsToCheck)
      .eq('status', 'checked_in')
      .order('check_in_time', { ascending: false })
      .limit(1);

    if (timesheetEntries && timesheetEntries.length > 0) {
      return NextResponse.json({ activeSession: timesheetEntries[0] });
    }

    return NextResponse.json({ activeSession: null });
  } catch (error) {
    console.error('Error in active session check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
