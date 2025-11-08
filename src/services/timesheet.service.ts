import { supabase } from '@/lib/supabase';

export interface TimesheetEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  parentId: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  totalHours: number | null;
  subject: string;
  status: 'checked-in' | 'checked-out';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  qrCodeUsed: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyTimesheetSummary {
  teacherId: string;
  teacherName: string;
  month: string;
  year: number;
  totalHours: number;
  totalSessions: number;
  entries: TimesheetEntry[];
  byStudent: {
    [studentId: string]: {
      studentName: string;
      hours: number;
      sessions: number;
    };
  };
  bySubject: {
    [subject: string]: {
      hours: number;
      sessions: number;
    };
  };
}

export class TimesheetService {
  /**
   * Check in teacher for a session using QR code
   */
  static async checkIn(
    qrCodeData: string,
    location?: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; entry?: TimesheetEntry; error?: string }> {
    try {
      // Parse QR code data
      const qrData = JSON.parse(qrCodeData);
      const { teacherId, studentId, parentId } = qrData;

      // Validate QR code
      const { data: qrCode, error: qrError } = await supabase
        .from('teacher_qr_codes')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('student_id', studentId)
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .single();

      if (qrError || !qrCode) {
        return {
          success: false,
          error: 'Invalid or expired QR code',
        };
      }

      // Get teacher and student details
      const [teacherRes, studentRes] = await Promise.all([
        supabase.from('teachers').select('name').eq('id', teacherId).single(),
        supabase.from('students').select('name').eq('id', studentId).single(),
      ]);

      if (teacherRes.error || studentRes.error) {
        return {
          success: false,
          error: 'Teacher or student not found',
        };
      }

      // Check if there's an active check-in
      const { data: activeSession, error: activeError } = await supabase
        .from('teacher_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('student_id', studentId)
        .eq('status', 'checked-in')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (activeSession && !activeError) {
        return {
          success: false,
          error: 'Teacher is already checked in for this student',
        };
      }

      // Create new timesheet entry
      const checkInTime = new Date();
      const { data: newEntry, error: insertError } = await supabase
        .from('teacher_sessions')
        .insert([
          {
            teacher_id: teacherId,
            teacher_name: teacherRes.data.name,
            student_id: studentId,
            student_name: studentRes.data.name,
            parent_id: parentId,
            check_in_time: checkInTime.toISOString(),
            status: 'checked-in',
            subject: qrCode.subject || 'General',
            location: location ? JSON.stringify(location) : null,
            qr_code_used: qrCodeData,
            created_at: checkInTime.toISOString(),
            updated_at: checkInTime.toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating timesheet entry:', insertError);
        return {
          success: false,
          error: 'Failed to create timesheet entry',
        };
      }

      return {
        success: true,
        entry: {
          id: newEntry.id,
          teacherId: newEntry.teacher_id,
          teacherName: newEntry.teacher_name,
          studentId: newEntry.student_id,
          studentName: newEntry.student_name,
          parentId: newEntry.parent_id,
          checkInTime: new Date(newEntry.check_in_time),
          checkOutTime: null,
          totalHours: null,
          subject: newEntry.subject,
          status: 'checked-in',
          location: newEntry.location
            ? JSON.parse(newEntry.location)
            : undefined,
          qrCodeUsed: newEntry.qr_code_used,
          notes: newEntry.notes,
          createdAt: new Date(newEntry.created_at),
          updatedAt: new Date(newEntry.updated_at),
        },
      };
    } catch (error) {
      console.error('Check-in error:', error);
      return {
        success: false,
        error: 'An error occurred during check-in',
      };
    }
  }

  /**
   * Check out teacher from a session
   */
  static async checkOut(
    sessionId: string,
    notes?: string
  ): Promise<{ success: boolean; entry?: TimesheetEntry; error?: string }> {
    try {
      // Get the active session
      const { data: session, error: sessionError } = await supabase
        .from('teacher_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('status', 'checked-in')
        .single();

      if (sessionError || !session) {
        return {
          success: false,
          error: 'Active session not found',
        };
      }

      // Calculate total hours
      const checkInTime = new Date(session.check_in_time);
      const checkOutTime = new Date();
      const totalHours =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Update session
      const { data: updatedSession, error: updateError } = await supabase
        .from('teacher_sessions')
        .update({
          check_out_time: checkOutTime.toISOString(),
          total_hours: totalHours,
          status: 'checked-out',
          notes: notes || session.notes,
          updated_at: checkOutTime.toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating session:', updateError);
        return {
          success: false,
          error: 'Failed to check out',
        };
      }

      return {
        success: true,
        entry: {
          id: updatedSession.id,
          teacherId: updatedSession.teacher_id,
          teacherName: updatedSession.teacher_name,
          studentId: updatedSession.student_id,
          studentName: updatedSession.student_name,
          parentId: updatedSession.parent_id,
          checkInTime: new Date(updatedSession.check_in_time),
          checkOutTime: new Date(updatedSession.check_out_time),
          totalHours: updatedSession.total_hours,
          subject: updatedSession.subject,
          status: 'checked-out',
          location: updatedSession.location
            ? JSON.parse(updatedSession.location)
            : undefined,
          qrCodeUsed: updatedSession.qr_code_used,
          notes: updatedSession.notes,
          createdAt: new Date(updatedSession.created_at),
          updatedAt: new Date(updatedSession.updated_at),
        },
      };
    } catch (error) {
      console.error('Check-out error:', error);
      return {
        success: false,
        error: 'An error occurred during check-out',
      };
    }
  }

  /**
   * Get active session for a teacher
   */
  static async getActiveSession(
    teacherId: string
  ): Promise<TimesheetEntry | null> {
    try {
      const { data, error } = await supabase
        .from('teacher_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('status', 'checked-in')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        teacherId: data.teacher_id,
        teacherName: data.teacher_name,
        studentId: data.student_id,
        studentName: data.student_name,
        parentId: data.parent_id,
        checkInTime: new Date(data.check_in_time),
        checkOutTime: data.check_out_time
          ? new Date(data.check_out_time)
          : null,
        totalHours: data.total_hours,
        subject: data.subject,
        status: data.status,
        location: data.location ? JSON.parse(data.location) : undefined,
        qrCodeUsed: data.qr_code_used,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  /**
   * Get timesheet entries for a teacher in a date range
   */
  static async getTimesheetEntries(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimesheetEntry[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString())
        .order('check_in_time', { ascending: false });

      if (error) {
        console.error('Error fetching timesheet entries:', error);
        return [];
      }

      return data.map((entry: any) => ({
        id: entry.id,
        teacherId: entry.teacher_id,
        teacherName: entry.teacher_name,
        studentId: entry.student_id,
        studentName: entry.student_name,
        parentId: entry.parent_id,
        checkInTime: new Date(entry.check_in_time),
        checkOutTime: entry.check_out_time
          ? new Date(entry.check_out_time)
          : null,
        totalHours: entry.total_hours,
        subject: entry.subject,
        status: entry.status,
        location: entry.location ? JSON.parse(entry.location) : undefined,
        qrCodeUsed: entry.qr_code_used,
        notes: entry.notes,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      return [];
    }
  }

  /**
   * Get monthly timesheet summary for a teacher
   */
  static async getMonthlyTimesheetSummary(
    teacherId: string,
    month: number,
    year: number
  ): Promise<MonthlyTimesheetSummary | null> {
    try {
      // Get start and end dates for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get all entries for the month
      const entries = await this.getTimesheetEntries(
        teacherId,
        startDate,
        endDate
      );

      if (entries.length === 0) {
        return null;
      }

      // Calculate summary
      const totalHours = entries.reduce(
        (sum, entry) => sum + (entry.totalHours || 0),
        0
      );

      const byStudent: MonthlyTimesheetSummary['byStudent'] = {};
      const bySubject: MonthlyTimesheetSummary['bySubject'] = {};

      entries.forEach(entry => {
        // By student
        const studentEntry = byStudent[entry.studentId];
        if (!studentEntry) {
          byStudent[entry.studentId] = {
            studentName: entry.studentName,
            hours: 0,
            sessions: 0,
          };
        }
        const currentStudent = byStudent[entry.studentId];
        if (currentStudent) {
          currentStudent.hours += entry.totalHours || 0;
          currentStudent.sessions += 1;
        }

        // By subject
        const subjectEntry = bySubject[entry.subject];
        if (!subjectEntry) {
          bySubject[entry.subject] = {
            hours: 0,
            sessions: 0,
          };
        }
        const currentSubject = bySubject[entry.subject];
        if (currentSubject) {
          currentSubject.hours += entry.totalHours || 0;
          currentSubject.sessions += 1;
        }
      });

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      return {
        teacherId,
        teacherName: entries[0]?.teacherName || '',
        month: monthNames[month - 1] || '',
        year,
        totalHours,
        totalSessions: entries.length,
        entries,
        byStudent,
        bySubject,
      };
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      return null;
    }
  }

  /**
   * Export monthly timesheet to CSV format
   */
  static async exportMonthlyTimesheetCSV(
    teacherId: string,
    month: number,
    year: number
  ): Promise<string> {
    const summary = await this.getMonthlyTimesheetSummary(
      teacherId,
      month,
      year
    );

    if (!summary) {
      return '';
    }

    const header = [
      'Date',
      'Student Name',
      'Subject',
      'Check-In Time',
      'Check-Out Time',
      'Total Hours',
      'Status',
      'Notes',
    ].join(',');

    const rows = summary.entries.map(entry => {
      return [
        entry.checkInTime.toLocaleDateString(),
        entry.studentName,
        entry.subject,
        entry.checkInTime.toLocaleTimeString(),
        entry.checkOutTime ? entry.checkOutTime.toLocaleTimeString() : 'N/A',
        entry.totalHours ? entry.totalHours.toFixed(2) : '0',
        entry.status,
        entry.notes || '',
      ]
        .map(field => `"${field}"`)
        .join(',');
    });

    const summaryRows = [
      '',
      'Summary',
      '',
      '',
      '',
      '',
      '',
      '',
      `Total Hours: ${summary.totalHours.toFixed(2)}`,
      `Total Sessions: ${summary.totalSessions}`,
    ];

    return [header, ...rows, ...summaryRows].join('\n');
  }
}

export default TimesheetService;
