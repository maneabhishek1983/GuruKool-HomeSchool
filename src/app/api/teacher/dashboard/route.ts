import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Admin client for bypassing RLS
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, serviceKey);
}

// Interface for student data
interface StudentData {
  id: string;
  name: string;
  grade: string;
  country: string;
  parent_id: string;
}

// Helper to merge and deduplicate students from multiple sources
function mergeStudentLists(
  qrStudents: Array<{ student_id: string; students: unknown }>,
  assignedStudents: StudentData[]
): Array<{
  id: string;
  name: string;
  grade: string;
  country: string;
  parentId: string;
  source: 'qr' | 'assigned' | 'both';
}> {
  const studentMap = new Map<
    string,
    {
      id: string;
      name: string;
      grade: string;
      country: string;
      parentId: string;
      source: 'qr' | 'assigned' | 'both';
    }
  >();

  // Add students from teacher_qr_codes
  for (const assignment of qrStudents) {
    const studentsData = assignment.students as unknown;
    const studentData = Array.isArray(studentsData)
      ? (studentsData[0] as StudentData | undefined)
      : (studentsData as StudentData | null);

    if (studentData?.id) {
      studentMap.set(studentData.id, {
        id: studentData.id,
        name: studentData.name || 'Unknown',
        grade: studentData.grade || 'N/A',
        country: studentData.country || 'N/A',
        parentId: studentData.parent_id || '',
        source: 'qr',
      });
    }
  }

  // Add students from assigned_teachers array (merge if exists)
  for (const student of assignedStudents) {
    const existing = studentMap.get(student.id);
    if (existing) {
      // Student exists in both sources
      existing.source = 'both';
    } else {
      // Student only in assigned_teachers
      studentMap.set(student.id, {
        id: student.id,
        name: student.name || 'Unknown',
        grade: student.grade || 'N/A',
        country: student.country || 'N/A',
        parentId: student.parent_id || '',
        source: 'assigned',
      });
    }
  }

  return Array.from(studentMap.values());
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request - try Authorization header first, fall back to cookies
    let authUser = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const {
        data: { user },
        error,
      } = await authClient.auth.getUser();
      if (!error && user) {
        authUser = user;
      }
    }

    // Fall back to cookie-based auth (browser requests)
    if (!authUser) {
      const cookieStore = cookies();
      const cookieClient = createRouteHandlerClient({
        cookies: () => cookieStore,
      });
      const {
        data: { user },
        error,
      } = await cookieClient.auth.getUser();
      if (!error && user) {
        authUser = user;
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Use authenticated user's ID; fall back to query param for backward compatibility
    const userId = authUser.id;
    const email = searchParams.get('email') || authUser.email;

    // If a different userId is passed, verify admin access
    const requestedUserId = searchParams.get('userId');
    if (requestedUserId && requestedUserId !== authUser.id) {
      const adminCheck = getAdminClient();
      const { data: userData } = await adminCheck
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();
      if ((userData as any)?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: can only access your own dashboard' },
          { status: 403 }
        );
      }
    }

    const supabase = getAdminClient();

    // Get teacher record (prioritizing parent-linked record if duplicate exists)
    let query = supabase
      .from('teachers')
      .select('id, name, parent_id, user_id, email');

    if (email) {
      // If email provided, match by User ID OR Email
      // This allows linking "Orphan" teacher accounts (from Auth) to "Profile" teacher accounts (from Parent)
      query = query.or(`user_id.eq.${userId},email.eq.${email}`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data: teachers, error: teacherQueryError } = await query;

    // Debug logging
    console.log('Teacher dashboard query:', {
      userId,
      email,
      teachersFound: teachers?.length || 0,
      teachers: teachers?.map(t => ({
        id: t.id,
        user_id: t.user_id,
        email: t.email,
        parent_id: t.parent_id,
      })),
      error: teacherQueryError?.message,
    });

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

    if (!teacherId) {
      return NextResponse.json({
        stats: {
          assignedStudents: 0,
          activeSessions: 0,
          totalHoursThisWeek: 0,
          completedSessionsThisWeek: 0,
        },
        upcomingSession: null,
        students: [],
        teacherId: null,
      });
    }

    // === SOURCE 1: Get students from teacher_qr_codes (QR-based assignments) ===
    const { data: qrAssignedStudents, error: qrError } = await supabase
      .from('teacher_qr_codes')
      .select(
        `
        student_id,
        students:student_id (id, name, grade, country, parent_id)
      `
      )
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .limit(50);

    // === SOURCE 2: Get students where teacher is in assigned_teachers JSONB array ===
    // This catches students assigned via parent portal even if QR code creation failed
    const { data: directAssignedStudents, error: directError } = await supabase
      .from('students')
      .select('id, name, grade, country, parent_id, assigned_teachers')
      .contains('assigned_teachers', [teacherId]);

    // Debug logging for student queries
    console.log('Student assignment queries:', {
      teacherId,
      qrStudentsCount: qrAssignedStudents?.length || 0,
      qrError: qrError?.message,
      directStudentsCount: directAssignedStudents?.length || 0,
      directError: directError?.message,
      directStudents: directAssignedStudents?.map(s => ({
        id: s.id,
        name: s.name,
        assigned_teachers: s.assigned_teachers,
      })),
    });

    // Merge both sources and deduplicate
    const mergedStudents = mergeStudentLists(
      qrAssignedStudents || [],
      (directAssignedStudents as StudentData[]) || []
    );

    // Get total count from merged list
    const assignedStudentsCount = mergedStudents.length;

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

    // Format students list with progress indicator
    const students = mergedStudents.map(student => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      country: student.country,
      parentId: student.parentId,
      progress: 0, // Progress should be calculated from actual data sheet activities
      assignmentSource: student.source, // 'qr', 'assigned', or 'both'
    }));

    return NextResponse.json({
      stats: {
        assignedStudents: assignedStudentsCount,
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
