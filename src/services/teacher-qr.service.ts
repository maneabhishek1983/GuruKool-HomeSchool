import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import QRCode from 'qrcode';

// Helper to get the appropriate Supabase client
// Uses admin client on server-side for bypassing RLS
function getServerSupabase() {
  if (typeof window === 'undefined') {
    try {
      return getSupabaseAdmin();
    } catch {
      return supabase;
    }
  }
  return supabase;
}

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
  // Now uses server-side API to protect QR secret
  static async generateQRCodeData(
    teacherId: string,
    studentId: string,
    parentId: string
  ): Promise<string> {
    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, studentId, parentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate QR code');
      }

      const { qrData } = await response.json();
      return qrData;
    } catch (error) {
      console.error('Error generating QR code data:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Generate a cryptographically secure signature for QR code validation
  private static async generateSignature(
    teacherId: string,
    studentId: string,
    parentId: string
  ): Promise<string> {
    const secret = process.env.NEXT_PUBLIC_QR_SECRET;
    if (!secret) {
      throw new Error('NEXT_PUBLIC_QR_SECRET environment variable is not configured');
    }
    const data = `${teacherId}-${studentId}-${parentId}`;

    // Use Web Crypto API for HMAC-SHA256 (works in both browser and Node.js)
    // Web Crypto API is available in all modern browsers and Node.js 15+
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    // Import key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Generate HMAC signature
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert to base64 and take first 32 characters for compact representation
    const signatureArray = Array.from(new Uint8Array(signature));
    const base64Signature = btoa(String.fromCharCode(...signatureArray));
    return base64Signature.slice(0, 32); // Use first 32 chars for compact but secure signature
  }

  // Create QR code image from data (iOS optimized)
  static async generateQRCodeImage(qrData: string): Promise<string> {
    try {
      const qrImageDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H', // Highest error correction for iOS compatibility
        type: 'image/png',
        quality: 1,
        margin: 4, // Adequate quiet zone for iOS scanning
        width: 512, // Optimal size for iOS camera recognition
        color: {
          dark: '#000000', // Pure black for maximum contrast
          light: '#FFFFFF', // Pure white background
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
      // Generate QR codes in parallel for better performance
      const qrCodePromises = studentIds.map(async studentId => {
        const qrData = await this.generateQRCodeData(
          teacherId,
          studentId,
          parentId
        );

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
        return data;
      });

      const qrCodes = await Promise.all(qrCodePromises);
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
  // Supports both simple format (GK:{id}) and legacy JSON format
  static async validateQRCodeAndCreateSession(
    qrData: string,
    sessionType: 'sign_in' | 'sign_out',
    location?: any,
    notes?: string
  ): Promise<TeacherSession | null> {
    try {
      // Use admin client on server-side to bypass RLS
      const db = getServerSupabase();
      let qrCode;

      // Check if it's the new simple format: GK:{uuid}
      if (qrData.startsWith('GK:')) {
        const qrCodeId = qrData.substring(3); // Remove 'GK:' prefix

        // Look up QR code by ID
        const { data, error } = await db
          .from('teacher_qr_codes')
          .select('*')
          .eq('id', qrCodeId)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          throw new Error(`QR code not found or inactive (ID: ${qrCodeId})`);
        }
        qrCode = data;
      } else {
        // Legacy JSON format - try to parse
        try {
          const parsedData = JSON.parse(qrData);

          if (parsedData.type !== 'teacher_auth') {
            throw new Error('Invalid QR code type');
          }

          // Look up QR code by teacher/student/parent IDs
          const { data, error } = await db
            .from('teacher_qr_codes')
            .select('*')
            .eq('teacher_id', parsedData.teacherId)
            .eq('student_id', parsedData.studentId)
            .eq('parent_id', parsedData.parentId)
            .eq('is_active', true)
            .single();

          if (error || !data) {
            throw new Error('QR code not found or inactive');
          }
          qrCode = data;
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes('QR code')) {
            throw parseError;
          }
          throw new Error('Invalid QR code format. Expected GK:{id} or valid JSON.');
        }
      }

      // Check for existing active session for this teacher
      const { data: existingSession } = await db
        .from('teacher_sessions')
        .select('*')
        .eq('teacher_id', qrCode.teacher_id)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1)
        .single();

      if (sessionType === 'sign_in') {
        // SIGN IN: Prevent duplicate active sessions
        if (existingSession) {
          throw new Error('You already have an active session. Please check out first.');
        }

        // Create new session
        const sessionData = {
          teacher_id: qrCode.teacher_id,
          student_id: qrCode.student_id,
          parent_id: qrCode.parent_id,
          session_type: sessionType,
          session_start: new Date().toISOString(),
          location: location || {},
          notes: notes || '',
          qr_code_used: qrCode.id,
        };

        const { data: session, error: sessionError } = await db
          .from('teacher_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (sessionError) {
          throw new Error(`Failed to create session: ${sessionError.message}`);
        }

        // Update QR code usage
        await db
          .from('teacher_qr_codes')
          .update({
            last_used: new Date().toISOString(),
            usage_count: qrCode.usage_count + 1,
          })
          .eq('id', qrCode.id);

        return session;
      } else {
        // SIGN OUT: Update existing active session
        if (!existingSession) {
          throw new Error('No active session found. Please check in first.');
        }

        const sessionEnd = new Date();
        const sessionStart = new Date(existingSession.session_start);
        const durationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 60000);

        const { data: updatedSession, error: updateError } = await db
          .from('teacher_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_minutes: durationMinutes,
            session_type: 'sign_out',
            notes: notes || existingSession.notes,
          })
          .eq('id', existingSession.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to end session: ${updateError.message}`);
        }

        // Update QR code usage
        await db
          .from('teacher_qr_codes')
          .update({
            last_used: new Date().toISOString(),
            usage_count: qrCode.usage_count + 1,
          })
          .eq('id', qrCode.id);

        return updatedSession;
      }
    } catch (error) {
      console.error('Error validating QR code and creating session:', error);
      // Re-throw the error so the API can show the specific message
      throw error;
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
      const newQRData = await this.generateQRCodeData(
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
