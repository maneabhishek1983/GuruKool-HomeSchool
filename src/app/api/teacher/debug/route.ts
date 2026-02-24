import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/teacher/debug
 * Debug endpoint to diagnose teacher dashboard issues
 * Returns detailed info about teacher record and student assignments
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = authUser.id;
    const email = authUser.email;

    // Step 1: Get user record
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();

    // Step 2: Get ALL teacher records (to see what exists)
    const { data: allTeachers, error: allTeachersError } = await supabase
      .from('teachers')
      .select('id, name, email, user_id, parent_id')
      .or(`user_id.eq.${userId},email.eq.${email}`);

    // Step 3: Get teacher record by user_id only
    const { data: teacherByUserId, error: teacherByUserIdError } =
      await supabase
        .from('teachers')
        .select('id, name, email, user_id, parent_id')
        .eq('user_id', userId);

    // Step 4: Get teacher record by email only
    const { data: teacherByEmail, error: teacherByEmailError } = await supabase
      .from('teachers')
      .select('id, name, email, user_id, parent_id')
      .eq('email', email);

    // Determine which teacher ID to use (same logic as dashboard)
    const teachers = allTeachers || [];
    const teacher = teachers.sort((a, b) => {
      if (a.parent_id && !b.parent_id) {
        return -1;
      }
      if (!a.parent_id && b.parent_id) {
        return 1;
      }
      return 0;
    })[0];

    const teacherId = teacher?.id;

    // Step 5: Get students with this teacher in assigned_teachers
    let studentsWithTeacher: any[] = [];
    let studentsError = null;
    if (teacherId) {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, grade_level, assigned_teachers, parent_id')
        .contains('assigned_teachers', [teacherId]);
      studentsWithTeacher = data || [];
      studentsError = error;
    }

    // Step 6: Get ALL students to see their assigned_teachers arrays
    const { data: allStudents, error: allStudentsError } = await supabase
      .from('students')
      .select('id, name, assigned_teachers')
      .limit(20);

    // Step 7: Get QR codes for this teacher
    let qrCodes: any[] = [];
    let qrError = null;
    if (teacherId) {
      const { data, error } = await supabase
        .from('teacher_qr_codes')
        .select('id, student_id, is_active')
        .eq('teacher_id', teacherId);
      qrCodes = data || [];
      qrError = error;
    }

    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),

      auth: {
        userId,
        email,
      },

      userRecord: {
        data: userRecord,
        error: userError?.message,
      },

      teacherLookup: {
        byUserIdOrEmail: {
          count: allTeachers?.length || 0,
          records: allTeachers,
          error: allTeachersError?.message,
        },
        byUserIdOnly: {
          count: teacherByUserId?.length || 0,
          records: teacherByUserId,
          error: teacherByUserIdError?.message,
        },
        byEmailOnly: {
          count: teacherByEmail?.length || 0,
          records: teacherByEmail,
          error: teacherByEmailError?.message,
        },
        selectedTeacher: teacher,
        selectedTeacherId: teacherId,
      },

      studentAssignments: {
        teacherId,
        studentsWithThisTeacher: {
          count: studentsWithTeacher.length,
          students: studentsWithTeacher,
          error: studentsError?.message,
        },
      },

      allStudentsSample: {
        count: allStudents?.length || 0,
        students: allStudents?.map(s => ({
          id: s.id,
          name: s.name,
          assigned_teachers: s.assigned_teachers,
        })),
        error: allStudentsError?.message,
      },

      qrCodes: {
        teacherId,
        count: qrCodes.length,
        codes: qrCodes,
        error: qrError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
