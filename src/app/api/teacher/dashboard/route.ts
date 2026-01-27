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
    const email = searchParams.get('email');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get teacher record
    // Get teacher record (prioritizing parent-linked record if duplicate exists)
    let query = supabase.from('teachers').select('id, name, parent_id');

    if (email) {
      // If email provided, match by User ID OR Email
      // This allows linking "Orphan" teacher accounts (from Auth) to "Profile" teacher accounts (from Parent)
      query = query.or(`user_id.eq.${userId},email.eq.${email}`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data: teachers } = await query;

    // Logic to pick the best teacher record:
    // 1. Prefer record with parent_id (means it's managed by a parent and likely has assignments)
    // 2. Otherwise pick the first one
    const teacher = teachers?.sort((a, b) => {
      if (a.parent_id && !b.parent_id) {
        return -1;
      }
      if (!a.parent_id && b.parent_id) {
        return 1;
      }
      return 0;
    })[0];

    const teacherId = teacher?.id;

    // Get assigned students count from teacher_qr_codes
    const { count: qrStudentsCount } = await supabase
      .from('teacher_qr_codes')
      .select('student_id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    // Also count from teacher_assignments (uses user_id)
    const { count: assignmentStudentsCount } = await supabase
      .from('teacher_assignments')
      .select('student_id', { count: 'exact', head: true })
      .eq('teacher_id', userId)
      .eq('is_active', true);

    // Use the higher count (they may overlap)
    const assignedStudentsCount = Math.max(
      qrStudentsCount || 0,
      assignmentStudentsCount || 0
    );

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

    // Get assigned students with details from teacher_qr_codes
    const { data: qrAssignedStudents } = await supabase
      .from('teacher_qr_codes')
      .select(
        `
        student_id,
        students:student_id (id, name, grade, country, parent_id)
      `
      )
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .limit(10);

    // Also check teacher_assignments table as fallback (uses user_id, not teachers.id)
    const { data: assignmentStudents } = await supabase
      .from('teacher_assignments')
      .select(
        `
        student_id,
        students:student_id (id, name, grade, country, parent_id)
      `
      )
      .eq('teacher_id', userId)
      .eq('is_active', true)
      .limit(10);

    // Merge both sources, deduplicate by student_id
    const seenStudentIds = new Set<string>();
    const assignedStudents = [
      ...(qrAssignedStudents || []),
      ...(assignmentStudents || []),
    ].filter(assignment => {
      const studentId = assignment.student_id;
      if (seenStudentIds.has(studentId)) {
        return false;
      }
      seenStudentIds.add(studentId);
      return true;
    });

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
            | {
                id: string;
                name: string;
                grade: string;
                country: string;
                parent_id: string;
              }
            | undefined)
        : (studentsData as {
            id: string;
            name: string;
            grade: string;
            country: string;
            parent_id: string;
          } | null);
      return {
        id: studentData?.id || assignment.student_id,
        name: studentData?.name || 'Unknown',
        grade: studentData?.grade || 'N/A',
        country: studentData?.country || 'N/A',
        parentId: studentData?.parent_id || '',
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
