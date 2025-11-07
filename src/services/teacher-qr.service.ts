import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

export interface TeacherQRCode {
  id: string;
  teacher_id: string;
  student_id: string;
  parent_id: string;
  qr_code_data: string;
  qr_code_type: 'student_auth';
  is_active: boolean;
  last_used?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherSession {
  id: string;
  teacher_id: string;
  student_id: string;
  parent_id: string;
  session_type: 'sign_in' | 'sign_out';
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  location?: any;
  notes?: string;
  qr_code_used?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export class TeacherQRService {
  // Generate QR code data for teacher-student authentication
  static generateQRCodeData(
    teacherId: string,
    studentId: string,
    parentId: string
  ): string {
    const data = {
      type: 'teacher_auth',
      teacherId,
      studentId,
      parentId,
      timestamp: Date.now(),
      signature: this.generateSignature(teacherId, studentId, parentId),
    };

    return JSON.stringify(data);
  }

  // Generate a simple signature for QR code validation
  private static generateSignature(
    teacherId: string,
    studentId: string,
    parentId: string
  ): string {
    const data = `${teacherId}-${studentId}-${parentId}-${process.env.NEXT_PUBLIC_QR_SECRET || 'default-secret'}`;
    return btoa(data).slice(0, 16); // Simple base64 encoding, truncated
  }

  // Create QR code image from data
  static async generateQRCodeImage(qrData: string): Promise<string> {
    try {
      const qrImageDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrImageDataUrl;
    } catch (error) {
      console.error('Error generating QR code image:', error);
      throw new Error('Failed to generate QR code image');
    }
  }

  // Create QR codes for a teacher when they're assigned to students
  static async createTeacherQRCodes(
    teacherId: string,
    studentIds: string[],
    parentId: string
  ): Promise<TeacherQRCode[]> {
    try {
      const qrCodes: TeacherQRCode[] = [];

      for (const studentId of studentIds) {
        const qrData = this.generateQRCodeData(teacherId, studentId, parentId);

        const { data, error } = await supabase
          .from('teacher_qr_codes')
          .insert({
            teacher_id: teacherId,
            student_id: studentId,
            parent_id: parentId,
            qr_code_data: qrData,
            qr_code_type: 'student_auth',
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }
        qrCodes.push(data);
      }

      return qrCodes;
    } catch (error) {
      console.error('Error creating teacher QR codes:', error);
      throw new Error('Failed to create teacher QR codes');
    }
  }

  // Get QR codes for a teacher
  static async getTeacherQRCodes(teacherId: string): Promise<TeacherQRCode[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_qr_codes')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher QR codes:', error);
      return [];
    }
  }

  // Get QR codes for a parent (all their teachers)
  static async getParentTeacherQRCodes(
    parentId: string
  ): Promise<TeacherQRCode[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_qr_codes')
        .select(
          `
          *,
          teachers:teacher_id(name, email),
          students:student_id(name, age, grade)
        `
        )
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching parent teacher QR codes:', error);
      return [];
    }
  }

  // Validate QR code and create session
  static async validateQRCodeAndCreateSession(
    qrData: string,
    sessionType: 'sign_in' | 'sign_out',
    location?: any,
    notes?: string
  ): Promise<TeacherSession | null> {
    try {
      // Parse QR code data
      const parsedData = JSON.parse(qrData);

      if (parsedData.type !== 'teacher_auth') {
        throw new Error('Invalid QR code type');
      }

      // Verify signature
      const expectedSignature = this.generateSignature(
        parsedData.teacherId,
        parsedData.studentId,
        parsedData.parentId
      );
      if (parsedData.signature !== expectedSignature) {
        throw new Error('Invalid QR code signature');
      }

      // Check if QR code exists and is active
      const { data: qrCode, error: qrError } = await supabase
        .from('teacher_qr_codes')
        .select('*')
        .eq('teacher_id', parsedData.teacherId)
        .eq('student_id', parsedData.studentId)
        .eq('parent_id', parsedData.parentId)
        .eq('is_active', true)
        .single();

      if (qrError || !qrCode) {
        throw new Error('QR code not found or inactive');
      }

      // Create session
      const sessionData = {
        teacher_id: parsedData.teacherId,
        student_id: parsedData.studentId,
        parent_id: parsedData.parentId,
        session_type: sessionType,
        location: location || {},
        notes: notes || '',
        qr_code_used: qrCode.id,
      };

      const { data: session, error: sessionError } = await supabase
        .from('teacher_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // Update QR code usage
      await supabase
        .from('teacher_qr_codes')
        .update({
          last_used: new Date().toISOString(),
          usage_count: qrCode.usage_count + 1,
        })
        .eq('id', qrCode.id);

      return session;
    } catch (error) {
      console.error('Error validating QR code and creating session:', error);
      return null;
    }
  }

  // Get teacher sessions
  static async getTeacherSessions(
    teacherId: string
  ): Promise<TeacherSession[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_sessions')
        .select(
          `
          *,
          students:student_id(name, age, grade)
        `
        )
        .eq('teacher_id', teacherId)
        .order('session_start', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher sessions:', error);
      return [];
    }
  }

  // Get parent's teacher sessions
  static async getParentTeacherSessions(
    parentId: string
  ): Promise<TeacherSession[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_sessions')
        .select(
          `
          *,
          teachers:teacher_id(name, email),
          students:student_id(name, age, grade)
        `
        )
        .eq('parent_id', parentId)
        .order('session_start', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching parent teacher sessions:', error);
      return [];
    }
  }

  // End a session (sign out)
  static async endSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_sessions')
        .update({
          session_end: new Date().toISOString(),
          duration_minutes: 0, // Will be calculated
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  }

  // Deactivate QR code
  static async deactivateQRCode(qrCodeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_qr_codes')
        .update({ is_active: false })
        .eq('id', qrCodeId);

      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error deactivating QR code:', error);
      return false;
    }
  }

  // Regenerate QR code
  static async regenerateQRCode(
    qrCodeId: string
  ): Promise<TeacherQRCode | null> {
    try {
      // Get existing QR code
      const { data: existingQR, error: fetchError } = await supabase
        .from('teacher_qr_codes')
        .select('*')
        .eq('id', qrCodeId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Generate new QR data
      const newQRData = this.generateQRCodeData(
        existingQR.teacher_id,
        existingQR.student_id,
        existingQR.parent_id
      );

      // Update QR code
      const { data, error } = await supabase
        .from('teacher_qr_codes')
        .update({
          qr_code_data: newQRData,
          usage_count: 0,
          last_used: null,
        })
        .eq('id', qrCodeId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      return null;
    }
  }
}
