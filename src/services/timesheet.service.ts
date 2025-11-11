import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

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

export class TimesheetService {
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
   * Validate QR code and decode data
   */
  static validateQRCode(qrDataString: string): CheckInOutData | null {
    try {
      const qrData: CheckInOutData = JSON.parse(qrDataString);

      // Verify signature
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
   * Check in teacher
   */
  static async checkIn(
    teacherId: string,
    qrDataString: string,
    location?: { latitude?: number; longitude?: number; address?: string }
  ): Promise<TimesheetEntry | null> {
    try {
      // Validate QR code
      const qrData = this.validateQRCode(qrDataString);
      if (!qrData) {
        throw new Error('Invalid QR code');
      }

      // Check if teacher is already checked in for this student
      const { data: existingEntry } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('student_id', qrData.studentId)
        .eq('status', 'checked_in')
        .single();

      if (existingEntry) {
        throw new Error('Teacher is already checked in for this student');
      }

      // Get QR code ID
      const { data: qrCode } = await supabase
        .from('parent_qr_codes')
        .select('id')
        .eq('parent_id', qrData.parentId)
        .eq('student_id', qrData.studentId)
        .eq('is_active', true)
        .single();

      if (!qrCode) {
        throw new Error('QR code not found');
      }

      // Create timesheet entry
      const { data, error } = await supabase
        .from('timesheet_entries')
        .insert({
          teacher_id: teacherId,
          student_id: qrData.studentId,
          parent_id: qrData.parentId,
          check_in_time: new Date().toISOString(),
          location: location || {},
          qr_code_id: qrCode.id,
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
   */
  static async getActiveCheckIn(
    teacherId: string
  ): Promise<TimesheetEntry | null> {
    try {
      const { data, error } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching active check-in:', error);
      return null;
    }
  }

  /**
   * Get timesheet entries for teacher
   */
  static async getTeacherTimesheet(
    teacherId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimesheetEntry[]> {
    try {
      let query = supabase
        .from('timesheet_entries')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('check_in_time', { ascending: false });

      if (startDate) {
        query = query.gte('check_in_time', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('check_in_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher timesheet:', error);
      return [];
    }
  }

  /**
   * Get timesheet entries for parent
   */
  static async getParentTimesheet(
    parentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimesheetEntry[]> {
    try {
      let query = supabase
        .from('timesheet_entries')
        .select('*')
        .eq('parent_id', parentId)
        .order('check_in_time', { ascending: false });

      if (startDate) {
        query = query.gte('check_in_time', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('check_in_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      return data || [];
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
