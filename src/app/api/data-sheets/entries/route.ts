import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

// GET - Retrieve activity entries for a student on a specific date
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');

    if (!studentId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: studentId and date' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get data sheet for the student on the specified date
    const { data: dataSheet, error: sheetError } = await supabase
      .from('data_sheets')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date)
      .single();

    if (sheetError && sheetError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is acceptable
      console.error('Error fetching data sheet:', sheetError);
      return NextResponse.json(
        { error: 'Error fetching data sheet' },
        { status: 500 }
      );
    }

    if (!dataSheet) {
      return NextResponse.json([]);
    }

    // Return the activities from the data sheet
    // Activities are stored as JSONB in the data_sheets table
    return NextResponse.json(dataSheet.activities || []);
  } catch (error) {
    console.error('Error in GET /api/data-sheets/entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save activity entries (creates or updates data sheet)
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentId, teacherId, date, entries } = body;

    if (!studentId || !teacherId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, teacherId, date' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student info for the title
    const { data: student } = await supabase
      .from('students')
      .select('name, parent_id')
      .eq('id', studentId)
      .single();

    const studentName = student?.name || 'Student';
    const parentId = student?.parent_id;

    // Format the activities for storage
    const formattedActivities = (entries || []).map((entry: any) => ({
      activityId: entry.activityId,
      activityName: entry.activityName,
      activityType: entry.category || 'academic',
      completed: entry.completed || false,
      cooperationLevel: entry.cooperationLevel || '',
      behaviour: entry.behaviour || '',
      observations: entry.comments || '',
      status: entry.completed ? 'completed' : 'scheduled',
      date: entry.date || date,
    }));

    // Check if data sheet exists for this date
    const { data: existingSheet } = await supabase
      .from('data_sheets')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', date)
      .single();

    let result;

    if (existingSheet) {
      // Update existing data sheet
      const { data, error } = await supabase
        .from('data_sheets')
        .update({
          activities: formattedActivities,
          teacher_id: teacherId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSheet.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating data sheet:', error);
        return NextResponse.json(
          { error: 'Error updating data sheet' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new data sheet
      const { data, error } = await supabase
        .from('data_sheets')
        .insert({
          student_id: studentId,
          teacher_id: teacherId,
          parent_id: parentId,
          date: date,
          title: `${studentName}'s Data Sheet - ${new Date(date).toLocaleDateString()}`,
          description: `Daily activity record for ${studentName}`,
          activities: formattedActivities,
          progress_summary: {
            overallProgress: calculateProgress(formattedActivities),
            areasOfStrength: [],
            areasForImprovement: [],
          },
          is_template: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating data sheet:', error);
        return NextResponse.json(
          { error: 'Error creating data sheet' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ success: true, dataSheet: result });
  } catch (error) {
    console.error('Error in POST /api/data-sheets/entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate progress
function calculateProgress(activities: any[]): number {
  if (!activities || activities.length === 0) {
    return 0;
  }
  const completed = activities.filter(
    (a: any) => a.completed || a.status === 'completed'
  ).length;
  return Math.round((completed / activities.length) * 100);
}
