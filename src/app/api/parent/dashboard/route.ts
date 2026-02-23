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
      const adminCheck = getAdminClient();
      const { data: userData } = await adminCheck
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if ((userData as any)?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: can only access your own dashboard' },
          { status: 403 }
        );
      }
    }

    const supabase = getAdminClient();

    // Get students for this parent
    const { data: students } = await supabase
      .from('students')
      .select('id, name')
      .eq('parent_id', parentId);

    const studentIds = (students || []).map(
      (s: { id: string; name: string }) => s.id
    );

    // Calculate average progress from data sheets
    let avgProgress = 0;
    if (studentIds.length > 0) {
      // Get last 30 days of activities with ratings
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activities } = await supabase
        .from('data_sheet_activities')
        .select(
          `
          rating,
          status,
          data_sheets!inner(student_id)
        `
        )
        .in('data_sheets.student_id', studentIds)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'completed')
        .not('rating', 'is', null);

      if (activities && activities.length > 0) {
        // Calculate average progress: rating (1-5) * 20 = percentage
        const totalRating = activities.reduce(
          (sum: number, a: { rating?: number }) => sum + (a.rating || 0),
          0
        );
        avgProgress = Math.round((totalRating / activities.length) * 20);
      }
    }

    // Calculate this month's hours from sessions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthSessions } = await supabase
      .from('teacher_sessions')
      .select('duration_minutes')
      .in('student_id', studentIds)
      .gte('session_start', startOfMonth.toISOString());

    const monthlyMinutes = (monthSessions || []).reduce(
      (sum: number, s: { duration_minutes?: number }) =>
        sum + (s.duration_minutes || 0),
      0
    );
    const monthlyHours = Math.round(monthlyMinutes / 60);

    // Also get timesheet_entries for this month (in case there are entries there)
    const { data: timesheetEntries } = await supabase
      .from('timesheet_entries')
      .select('duration_minutes')
      .eq('parent_id', parentId)
      .gte('check_in_time', startOfMonth.toISOString());

    const timesheetMinutes = (timesheetEntries || []).reduce(
      (sum: number, e: { duration_minutes?: number }) =>
        sum + (e.duration_minutes || 0),
      0
    );

    // Total monthly hours (from both sources, deduplicated by taking max)
    const totalMonthlyHours = Math.round(
      Math.max(monthlyMinutes, timesheetMinutes) / 60
    );

    // Get individual student progress
    const studentProgress: {
      studentId: string;
      studentName: string;
      progress: number;
    }[] = [];

    for (const student of students || []) {
      const { data: studentActivities } = await supabase
        .from('data_sheet_activities')
        .select(
          `
          rating,
          status,
          data_sheets!inner(student_id)
        `
        )
        .eq('data_sheets.student_id', student.id)
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq('status', 'completed')
        .not('rating', 'is', null);

      let progress = 0;
      if (studentActivities && studentActivities.length > 0) {
        const totalRating = studentActivities.reduce(
          (sum: number, a: { rating?: number }) => sum + (a.rating || 0),
          0
        );
        progress = Math.round((totalRating / studentActivities.length) * 20);
      }

      studentProgress.push({
        studentId: student.id,
        studentName: student.name,
        progress,
      });
    }

    return NextResponse.json({
      avgProgress,
      monthlyHours: totalMonthlyHours,
      studentProgress,
    });
  } catch (error) {
    console.error('Error fetching parent dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
