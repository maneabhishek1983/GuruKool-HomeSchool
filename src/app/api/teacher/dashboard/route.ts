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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get teacher record
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    const teacherId = teacher?.id;

    // Get assigned students count (from teacher_qr_codes which tracks assignments)
    const { count: assignedStudentsCount } = await supabase
      .from('teacher_qr_codes')
      .select('student_id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    // Get sessions this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: weekSessions } = await supabase
      .from('teacher_sessions')
      .select('duration_minutes, session_start, session_end')
      .eq('teacher_id', teacherId)
      .gte('session_start', startOfWeek.toISOString());

    // Calculate total hours this week
    const totalMinutes = (weekSessions || []).reduce((sum, session) => {
      return sum + (session.duration_minutes || 0);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Get active session count
    const { count: activeSessionsCount } = await supabase
      .from('teacher_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .is('session_end', null);

    // Get upcoming/next session
    const { data: upcomingSessions } = await supabase
      .from('teacher_sessions')
      .select(
        `
        id,
        session_start,
        student_id,
        students:student_id (name)
      `
      )
      .eq('teacher_id', teacherId)
      .is('session_end', null)
      .order('session_start', { ascending: true })
      .limit(1);

    // Get assigned students with details
    const { data: assignedStudents } = await supabase
      .from('teacher_qr_codes')
      .select(
        `
        student_id,
        students:student_id (id, name, grade, country)
      `
      )
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .limit(10);

    // Format upcoming session
    let upcomingSession = null;
    const firstSession = upcomingSessions?.[0];
    if (firstSession) {
      const session = firstSession;
      // Handle both single object and array format from Supabase join
      const studentsData = session.students as unknown;
      const studentData = Array.isArray(studentsData)
        ? (studentsData[0] as { name: string } | undefined)
        : (studentsData as { name: string } | null);
      const sessionTime = new Date(session.session_start);
      const now = new Date();
      const diffMs = sessionTime.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);

      let timeText = '';
      if (diffMins < 0) {
        timeText = 'In progress';
      } else if (diffMins < 60) {
        timeText = `In ${diffMins} minutes`;
      } else {
        const hours = Math.round(diffMins / 60);
        timeText = `In ${hours} hour${hours > 1 ? 's' : ''}`;
      }

      upcomingSession = {
        studentName: studentData?.name || 'Unknown Student',
        time: timeText,
      };
    }

    // Format students list
    const students = (assignedStudents || []).map(assignment => {
      // Handle both single object and array format from Supabase join
      const studentsData = assignment.students as unknown;
      const studentData = Array.isArray(studentsData)
        ? (studentsData[0] as
            | { id: string; name: string; grade: string; country: string }
            | undefined)
        : (studentsData as {
            id: string;
            name: string;
            grade: string;
            country: string;
          } | null);
      return {
        id: studentData?.id || assignment.student_id,
        name: studentData?.name || 'Unknown',
        grade: studentData?.grade || 'N/A',
        country: studentData?.country || 'N/A',
        progress: Math.floor(Math.random() * 20) + 80, // TODO: Calculate real progress
      };
    });

    return NextResponse.json({
      stats: {
        assignedStudents: assignedStudentsCount || 0,
        activeSessions: activeSessionsCount || 0,
        totalHoursThisWeek: totalHours,
        completedSessionsThisWeek: (weekSessions || []).filter(
          s => s.session_end
        ).length,
      },
      upcomingSession,
      students,
      teacherId,
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
