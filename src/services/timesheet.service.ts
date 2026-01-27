import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import { TeacherSession } from '@/services/teacher-qr.service';

export interface TimesheetEntry {
  id: string;
  teacher_id: string;
  student_id: string;
  parent_id: string;
  check_in_time: string;
  check_out_time?: string;
  duration_minutes?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  notes?: string;
  qr_code_id: string;
  status: 'checked_in' | 'checked_out';
  created_at: string;
  updated_at: string;
}

export interface ParentQRCode {
  id: string;
  parent_id: string;
  student_id: string;
  qr_code_data: string;
  qr_code_image: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface CheckInOutData {
  type: 'check_in' | 'check_out';
  parentId: string;
  studentId: string;
  teacherId?: string;
  timestamp: number;
  signature: string;
}

export interface MonthlyTimesheetSummary {
  totalHours: number;
  totalSessions: number;
  totalEarnings: number;
  sessionsByDate: Record<string, any>;
  byStudent: Record<
    string,
    {
      studentName: string;
      sessions: number;
      hours: number;
    }
  >;
  bySubject: Record<
    string,
    {
      subjectName: string;
      sessions: number;
      hours: number;
    }
  >;
  entries: Array<{
    id: string;
    checkInTime: Date;
    checkOutTime: Date | null;
    studentName: string;
    subject: string;
    hours: number;
  }>;
}

export class TimesheetService {
  /**
   * PRIVATE HELPER: Convert TeacherSession to TimesheetEntry format
   * Enables unified display of sessions from both OLD and NEW systems
   */
  private static convertTeacherSessionToTimesheetEntry(
    session: TeacherSession
  ): TimesheetEntry {
    return {
      id: session.id,
      teacher_id: session.teacher_id,
      student_id: session.student_id,
      parent_id: session.parent_id,
      check_in_time: session.session_start,
      check_out_time: session.session_end || undefined,
      duration_minutes: session.duration_minutes || undefined,
      location: session.location,
      notes: session.notes || undefined,
      qr_code_id: session.qr_code_used || '',
      status: session.session_end ? 'checked_out' : 'checked_in',
      created_at: session.created_at,
      updated_at: session.updated_at,
    } as unknown as TimesheetEntry;
  }

  /**
   * PRIVATE HELPER: Deduplicate entries by ID
   * Prevents showing the same session twice when it exists in both tables
   */
  private static deduplicateById(entries: TimesheetEntry[]): TimesheetEntry[] {
    const seen = new Set<string>();
    return entries.filter(entry => {
      if (seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
  }

  /**
   * PRIVATE HELPER: Query both OLD and NEW systems, merge results
   * This is the core abstraction that fixes data fragmentation
   */
  private static async queryBothSystems(filters: {
    teacherId?: string;
    parentId?: string;
    studentId?: string;
    startDate?: Date;
    endDate?: Date;
    onlyActive?: boolean; // For getActiveCheckIn
  }): Promise<TimesheetEntry[]> {
    try {
      const results: TimesheetEntry[] = [];

      // Query OLD system (timesheet_entries)
      let oldQuery = supabase.from('timesheet_entries').select('*');

      if (filters.teacherId) {
        oldQuery = oldQuery.eq('teacher_id', filters.teacherId);
      }
      if (filters.parentId) {
        oldQuery = oldQuery.eq('parent_id', filters.parentId);
      }
      if (filters.studentId) {
        oldQuery = oldQuery.eq('student_id', filters.studentId);
      }
      if (filters.onlyActive) {
        oldQuery = oldQuery.eq('status', 'checked_in');
      }
      if (filters.startDate) {
        oldQuery = oldQuery.gte(
          'check_in_time',
          filters.startDate.toISOString()
        );
      }
      if (filters.endDate) {
        oldQuery = oldQuery.lte('check_in_time', filters.endDate.toISOString());
      }

      oldQuery = oldQuery.order('check_in_time', { ascending: false });

      const { data: oldEntries } = await oldQuery;

      if (oldEntries) {
        results.push(...oldEntries);
      }

      // Query NEW system (teacher_sessions)
      let newQuery = supabase.from('teacher_sessions').select('*');

      if (filters.teacherId) {
        newQuery = newQuery.eq('teacher_id', filters.teacherId);
      }
      if (filters.parentId) {
        newQuery = newQuery.eq('parent_id', filters.parentId);
      }
      if (filters.studentId) {
        newQuery = newQuery.eq('student_id', filters.studentId);
      }
      if (filters.onlyActive) {
        newQuery = newQuery.is('session_end', null); // NULL = still checked in
      }
      if (filters.startDate) {
        newQuery = newQuery.gte(
          'session_start',
          filters.startDate.toISOString()
        );
      }
      if (filters.endDate) {
        newQuery = newQuery.lte('session_start', filters.endDate.toISOString());
      }

      newQuery = newQuery.order('session_start', { ascending: false });

      const { data: newSessions } = await newQuery;

      if (newSessions) {
        const converted = newSessions.map((session: TeacherSession) =>
          this.convertTeacherSessionToTimesheetEntry(session)
        );
        results.push(...converted);
      }

      // Deduplicate and sort by check-in time (most recent first)
      const deduplicated = this.deduplicateById(results);
      return deduplicated.sort(
        (a, b) =>
          new Date(b.check_in_time).getTime() -
          new Date(a.check_in_time).getTime()
      );
    } catch (error) {
      console.error('Error querying both systems:', error);
      return [];
    }
  }

  /**
   * Generate QR code for parent portal (for teacher check-in/out)
   */
  static async generateParentQRCode(
    parentId: string,
    studentId: string
  ): Promise<ParentQRCode> {
    try {
      // Create QR code data
      const qrData: CheckInOutData = {
        type: 'check_in', // Default, will be selected by teacher
        parentId,
        studentId,
        timestamp: Date.now(),
        signature: this.generateSignature(parentId, studentId),
      };

      const qrDataString = JSON.stringify(qrData);

      // Generate real QR code image (iOS compatible)
      const qrCodeImage = await QRCode.toDataURL(qrDataString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 1,
        margin: 4,
        width: 512,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Store in database
      const { data, error } = await supabase
        .from('parent_qr_codes')
        .insert({
          parent_id: parentId,
          student_id: studentId,
          qr_code_data: qrDataString,
          qr_code_image: qrCodeImage,
          is_active: true,
          expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error generating parent QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Get active QR codes for a parent
   */
  static async getParentQRCodes(parentId: string): Promise<ParentQRCode[]> {
    try {
      const { data, error } = await supabase
        .from('parent_qr_codes')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching parent QR codes:', error);
      return [];
    }
  }

  /**
   * Validate QR code and decode data (supports BOTH OLD and NEW systems)
   */
  static validateQRCode(qrDataString: string): CheckInOutData | null {
    try {
      const parsedData = JSON.parse(qrDataString);

      // CASE 1: NEW System (teacher_auth from TeacherQRService)
      if (parsedData.type === 'teacher_auth') {
        // Convert NEW format to OLD format for compatibility
        return {
          type: 'check_in', // Will be determined by context
          parentId: parsedData.parentId,
          studentId: parsedData.studentId,
          teacherId: parsedData.teacherId, // NEW system includes teacherId
          timestamp: parsedData.timestamp,
          signature: parsedData.signature,
        } as CheckInOutData;
      }

      // CASE 2: OLD System (check_in/check_out from TimesheetService)
      const qrData: CheckInOutData = parsedData;

      // Verify signature for OLD system
      const expectedSignature = this.generateSignature(
        qrData.parentId,
        qrData.studentId
      );

      if (qrData.signature !== expectedSignature) {
        throw new Error('Invalid QR code signature');
      }

      // Check if QR code is not too old (24 hours)
      const age = Date.now() - qrData.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        throw new Error('QR code expired');
      }

      return qrData;
    } catch (error) {
      console.error('Error validating QR code:', error);
      return null;
    }
  }

  /**
   * Check in teacher (supports BOTH OLD and NEW QR systems)
   */
  static async checkIn(
    teacherId: string,
    qrDataString: string,
    location?: { latitude?: number; longitude?: number; address?: string }
  ): Promise<TimesheetEntry | null> {
    try {
      // Validate QR code (handles both OLD and NEW formats)
      const qrData = this.validateQRCode(qrDataString);
      if (!qrData) {
        throw new Error('Invalid QR code');
      }

      // P0 FIX: Check if teacher is already checked in (queries BOTH systems)
      const activeSession = await this.getActiveCheckIn(teacherId);
      if (activeSession) {
        throw new Error(
          'Teacher is already checked in. Please check out first.'
        );
      }

      // Try to find QR code in BOTH systems
      let qrCodeId: string | null = null;

      // Check NEW system first (teacher_qr_codes)
      const { data: newQrCode } = await supabase
        .from('teacher_qr_codes')
        .select('id')
        .eq('parent_id', qrData.parentId)
        .eq('student_id', qrData.studentId)
        .eq('is_active', true)
        .maybeSingle();

      if (newQrCode) {
        qrCodeId = newQrCode.id;
      } else {
        // Fallback to OLD system (parent_qr_codes)
        const { data: oldQrCode } = await supabase
          .from('parent_qr_codes')
          .select('id')
          .eq('parent_id', qrData.parentId)
          .eq('student_id', qrData.studentId)
          .eq('is_active', true)
          .maybeSingle();

        if (oldQrCode) {
          qrCodeId = oldQrCode.id;
        }
      }

      if (!qrCodeId) {
        throw new Error('QR code not found in database');
      }

      // Create timesheet entry in OLD system
      const { data, error } = await supabase
        .from('timesheet_entries')
        .insert({
          teacher_id: teacherId,
          student_id: qrData.studentId,
          parent_id: qrData.parentId,
          check_in_time: new Date().toISOString(),
          location: location || {},
          qr_code_id: qrCodeId,
          status: 'checked_in',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking in:', error);
      return null;
    }
  }

  /**
   * Check out teacher
   */
  static async checkOut(
    teacherId: string,
    qrDataString: string,
    notes?: string,
    location?: { latitude?: number; longitude?: number; address?: string }
  ): Promise<TimesheetEntry | null> {
    try {
      // Validate QR code
      const qrData = this.validateQRCode(qrDataString);
      if (!qrData) {
        throw new Error('Invalid QR code');
      }

      // Find active check-in entry
      const { data: entry, error: fetchError } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('student_id', qrData.studentId)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !entry) {
        throw new Error('No active check-in found');
      }

      // Calculate duration
      const checkInTime = new Date(entry.check_in_time);
      const checkOutTime = new Date();
      const durationMinutes = Math.round(
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)
      );

      // Update entry
      const { data, error } = await supabase
        .from('timesheet_entries')
        .update({
          check_out_time: checkOutTime.toISOString(),
          duration_minutes: durationMinutes,
          notes: notes || '',
          status: 'checked_out',
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking out:', error);
      return null;
    }
  }

  /**
   * Get active check-in for teacher
   * FIXED: Now handles the ID mismatch between users.id and teachers.id
   * - timesheet_entries.teacher_id stores users.id (auth user ID)
   * - teacher_sessions.teacher_id stores teachers.id (teachers table ID)
   */
  static async getActiveCheckIn(
    userIdOrTeacherId: string
  ): Promise<TimesheetEntry | null> {
    try {
      const results: TimesheetEntry[] = [];

      // 1. Query OLD system (timesheet_entries) using the ID directly
      // This works because timesheet_entries.teacher_id stores users.id
      const { data: oldEntries } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('teacher_id', userIdOrTeacherId)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false });

      if (oldEntries) {
        results.push(...oldEntries);
      }

      // 2. Look up teacher's ID in teachers table (for teacher_sessions query)
      const { data: teacherRecord } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userIdOrTeacherId)
        .single();

      // 3. Query NEW system (teacher_sessions) using teachers.id
      if (teacherRecord) {
        const { data: newSessions } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('teacher_id', teacherRecord.id)
          .is('session_end', null) // NULL = still checked in
          .order('session_start', { ascending: false });

        if (newSessions) {
          const converted = newSessions.map((session: TeacherSession) =>
            this.convertTeacherSessionToTimesheetEntry(session)
          );
          results.push(...converted);
        }
      }

      // Deduplicate and return the most recent
      const deduplicated = this.deduplicateById(results);
      return deduplicated[0] || null;
    } catch (error) {
      console.error('Error fetching active check-in:', error);
      return null;
    }
  }

  /**
   * Get timesheet entries for teacher
   * FIXED: Now queries BOTH OLD and NEW systems for complete data
   */
  static async getTeacherTimesheet(
    teacherId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimesheetEntry[]> {
    try {
      const filters: {
        teacherId: string;
        startDate?: Date;
        endDate?: Date;
      } = { teacherId };
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      return await this.queryBothSystems(filters);
    } catch (error) {
      console.error('Error fetching teacher timesheet:', error);
      return [];
    }
  }

  /**
   * Get timesheet entries for parent
   * FIXED: Now queries BOTH OLD and NEW systems for complete data
   */
  static async getParentTimesheet(
    parentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimesheetEntry[]> {
    try {
      const filters: {
        parentId: string;
        startDate?: Date;
        endDate?: Date;
      } = { parentId };
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      return await this.queryBothSystems(filters);
    } catch (error) {
      console.error('Error fetching parent timesheet:', error);
      return [];
    }
  }

  /**
   * Calculate total hours for teacher
   */
  static async calculateTeacherHours(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMinutes: number;
    totalHours: number;
    entriesCount: number;
    byStudent: Record<
      string,
      { minutes: number; hours: number; count: number }
    >;
  }> {
    try {
      const entries = await this.getTeacherTimesheet(
        teacherId,
        startDate,
        endDate
      );

      const completedEntries = entries.filter(
        e => e.status === 'checked_out' && e.duration_minutes
      );

      const totalMinutes = completedEntries.reduce(
        (sum, e) => sum + (e.duration_minutes || 0),
        0
      );

      const byStudent: Record<
        string,
        { minutes: number; hours: number; count: number }
      > = {};

      completedEntries.forEach(entry => {
        if (!byStudent[entry.student_id]) {
          byStudent[entry.student_id] = { minutes: 0, hours: 0, count: 0 };
        }
        const studentData = byStudent[entry.student_id];
        if (studentData) {
          studentData.minutes += entry.duration_minutes || 0;
          studentData.count += 1;
        }
      });

      // Convert minutes to hours for each student
      Object.keys(byStudent).forEach(studentId => {
        const studentData = byStudent[studentId];
        if (studentData) {
          studentData.hours =
            Math.round((studentData.minutes / 60) * 100) / 100;
        }
      });

      return {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        entriesCount: completedEntries.length,
        byStudent,
      };
    } catch (error) {
      console.error('Error calculating teacher hours:', error);
      return {
        totalMinutes: 0,
        totalHours: 0,
        entriesCount: 0,
        byStudent: {},
      };
    }
  }

  /**
   * Get monthly timesheet summary for teacher
   * FIXED: Now properly implemented using queryBothSystems
   */
  static async getMonthlyTimesheetSummary(
    teacherId: string,
    month: number,
    year: number
  ): Promise<MonthlyTimesheetSummary | null> {
    try {
      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Get all entries for the month (from BOTH systems)
      const entries = await this.getTeacherTimesheet(
        teacherId,
        startDate,
        endDate
      );

      // Filter completed entries only
      const completedEntries = entries.filter(
        e => e.status === 'checked_out' && e.duration_minutes
      );

      // Calculate totals
      const totalMinutes = completedEntries.reduce(
        (sum, e) => sum + (e.duration_minutes || 0),
        0
      );
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

      // Group by student
      const byStudent: Record<string, any> = {};
      completedEntries.forEach(entry => {
        if (!byStudent[entry.student_id]) {
          byStudent[entry.student_id] = {
            studentName: `Student ${entry.student_id.slice(0, 8)}`, // TODO: Fetch actual student name
            sessions: 0,
            hours: 0,
          };
        }
        const student = byStudent[entry.student_id];
        if (student) {
          student.sessions += 1;
          student.hours +=
            Math.round(((entry.duration_minutes || 0) / 60) * 100) / 100;
        }
      });

      // Group by date
      const sessionsByDate: Record<string, any[]> = {};
      completedEntries.forEach(entry => {
        const dateKey = new Date(entry.check_in_time)
          .toISOString()
          .split('T')[0];
        if (dateKey) {
          if (!sessionsByDate[dateKey]) {
            sessionsByDate[dateKey] = [];
          }
          sessionsByDate[dateKey]?.push(entry);
        }
      });

      return {
        totalHours,
        totalSessions: completedEntries.length,
        totalEarnings: 0, // TODO: Calculate based on hourly rate if available
        sessionsByDate,
        byStudent,
        bySubject: {}, // TODO: Implement if subject tracking is added
        entries: completedEntries.map(e => ({
          id: e.id,
          checkInTime: new Date(e.check_in_time),
          checkOutTime: e.check_out_time ? new Date(e.check_out_time) : null,
          studentName: `Student ${e.student_id.slice(0, 8)}`,
          subject: '', // TODO: Add subject field if available
          hours: Math.round(((e.duration_minutes || 0) / 60) * 100) / 100,
        })),
      };
    } catch (error) {
      console.error('Error getting monthly timesheet summary:', error);
      return null;
    }
  }

  /**
   * Export monthly timesheet as CSV
   * FIXED: Now properly implemented using getMonthlyTimesheetSummary
   */
  static async exportMonthlyTimesheetCSV(
    teacherId: string,
    month: number,
    year: number
  ): Promise<string | null> {
    try {
      const summary = await this.getMonthlyTimesheetSummary(
        teacherId,
        month,
        year
      );
      if (!summary) {
        return null;
      }

      // CSV header
      let csv =
        'Date,Check In Time,Check Out Time,Duration (hours),Student,Subject,Notes\n';

      // CSV rows
      summary.entries.forEach(entry => {
        const date = entry.checkInTime.toLocaleDateString('en-US');
        const checkIn = entry.checkInTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const checkOut = entry.checkOutTime
          ? entry.checkOutTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';
        const hours = entry.hours.toFixed(2);
        const student = entry.studentName;
        const subject = entry.subject || '';

        // Escape quotes in fields for CSV safety
        const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

        csv += `${escapeCsv(date)},${escapeCsv(checkIn)},${escapeCsv(checkOut)},${hours},${escapeCsv(student)},${escapeCsv(subject)},""\n`;
      });

      // Summary rows
      csv += '\n';
      csv += `Total Sessions,,,,${summary.totalSessions}\n`;
      csv += `Total Hours,,,,${summary.totalHours.toFixed(2)}\n`;

      // By-student breakdown
      csv += '\nStudent,Sessions,Hours\n';
      Object.values(summary.byStudent).forEach((student: any) => {
        csv += `"${student.studentName}",${student.sessions},${student.hours.toFixed(2)}\n`;
      });

      return csv;
    } catch (error) {
      console.error('Error exporting monthly timesheet CSV:', error);
      return null;
    }
  }

  /**
   * Legacy alias for getActiveCheckIn
   */
  static async getActiveSession(
    teacherId: string
  ): Promise<TimesheetEntry | null> {
    return this.getActiveCheckIn(teacherId);
  }

  /**
   * Generate signature for QR code validation
   */
  private static generateSignature(
    parentId: string,
    studentId: string
  ): string {
    const secret = process.env.NEXT_PUBLIC_QR_SECRET || 'default-secret';
    const data = `${parentId}-${studentId}-${secret}`;
    return btoa(data).slice(0, 16);
  }

  /**
   * Regenerate QR code for parent
   */
  static async regenerateParentQRCode(
    parentId: string,
    studentId: string
  ): Promise<ParentQRCode> {
    try {
      // Deactivate old QR codes
      await supabase
        .from('parent_qr_codes')
        .update({ is_active: false })
        .eq('parent_id', parentId)
        .eq('student_id', studentId);

      // Generate new QR code
      return await this.generateParentQRCode(parentId, studentId);
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      throw new Error('Failed to regenerate QR code');
    }
  }
}

export const timesheetService = TimesheetService;
