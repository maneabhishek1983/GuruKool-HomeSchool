import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Retrieve data sheets for a student
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
    const authClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication', code: 'AUTH_INVALID' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: studentId' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all data sheets for the student
    const { data: dataSheets, error } = await supabase
      .from('data_sheets')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching data sheets:', error);
      return NextResponse.json(
        { error: 'Error fetching data sheets' },
        { status: 500 }
      );
    }

    // Format the data sheets for the frontend
    const formattedSheets = (dataSheets || []).map((sheet: any) => ({
      id: sheet.id,
      studentId: sheet.student_id,
      teacherId: sheet.teacher_id,
      parentId: sheet.parent_id,
      date: sheet.date,
      title: sheet.title,
      description: sheet.description,
      activities: sheet.activities || [],
      progressSummary: sheet.progress_summary || {
        overallProgress: 0,
        areasOfStrength: [],
        areasForImprovement: [],
      },
      challenges: sheet.challenges || [],
      prompts: sheet.prompts || [],
      notes: sheet.notes,
      isTemplate: sheet.is_template,
      templateName: sheet.template_name,
      createdAt: sheet.created_at,
      updatedAt: sheet.updated_at,
    }));

    return NextResponse.json(formattedSheets);
  } catch (error) {
    console.error('Error in GET /api/data-sheets/student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
