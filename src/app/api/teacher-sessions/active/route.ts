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
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Step 1: Look up teacher record by user_id
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (teacherError || !teacher) {
      // No teacher record found - check timesheet_entries directly
      // (in case they have old-style entries with user_id as teacher_id)
      const { data: oldEntries } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('teacher_id', userId)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false })
        .limit(1);

      if (oldEntries && oldEntries.length > 0) {
        return NextResponse.json({ activeSession: oldEntries[0] });
      }

      return NextResponse.json({ activeSession: null });
    }

    // Step 2: Query teacher_sessions for active session
    const { data: sessions, error: sessionsError } = await supabase
      .from('teacher_sessions')
      .select('*')
      .eq('teacher_id', teacher.id)
      .is('session_end', null)
      .order('session_start', { ascending: false })
      .limit(1);

    if (sessionsError) {
      console.error('Error querying teacher_sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to query sessions' },
        { status: 500 }
      );
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

    // Step 3: Also check timesheet_entries (for any synced entries)
    const { data: timesheetEntries } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('teacher_id', userId)
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
