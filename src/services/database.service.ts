import { supabase, getSupabaseAdmin, type Database } from '@/lib/supabase';

type Tables = Database['public']['Tables'];

// Simple in-memory cache for read-mostly data (per server instance)
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

function getCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) {
    return null;
  }
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value as T;
}

function setCache<T>(key: string, value: T, ttlMs: number) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export const databaseService = {
  // Safe client-side reads using anon key
  async getUserProfile(userId: string) {
    const cacheKey = `user:${userId}`;
    const cached = getCache<Tables['users']['Row']>(cacheKey);
    if (cached) {
      return cached;
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      throw error;
    }
    if (data) {
      setCache(cacheKey, data, 30_000);
    }
    return data;
  },

  async listUpcomingSessions(
    userId: string,
    role: 'parent' | 'teacher' | 'admin'
  ) {
    const cacheKey = `sessions:${role}:${userId}`;
    const cached = getCache<Tables['sessions']['Row'][]>(cacheKey);
    if (cached) {
      return cached;
    }
    const column =
      role === 'parent'
        ? 'parent_id'
        : role === 'teacher'
          ? 'teacher_id'
          : 'teacher_id';
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq(column, userId)
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(20);
    if (error) {
      throw error;
    }
    if (data) {
      setCache(cacheKey, data, 15_000);
    }
    return data;
  },

  // Server-only admin writes using service role
  async upsertUserProfile(user: Tables['users']['Insert']) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('users')
      .upsert(user)
      .select('*')
      .single();
    if (error) {
      throw error;
    }
    memoryCache.delete(`user:${data.id}`);
    return data;
  },
};

import { StudentProfile, TeacherProfile } from '@/types';
import { TeacherQRService } from './teacher-qr.service';

export interface DatabaseStudent {
  id: string;
  parent_id: string;
  name: string;
  age: number;
  country: 'UK' | 'US' | 'INDIA';
  grade_level: string;
  grade_system: 'uk_year' | 'us_grade' | 'india_class';
  birth_date?: string;
  learning_preferences?: any;
  special_needs?: any;
  academic_standards?: any;
  profile_picture_url?: string;
  assigned_teachers?: string[];
  teacher_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTeacher {
  id: string;
  user_id: string;
  parent_id: string;
  name: string;
  email: string;
  phone?: string;
  subjects: string[];
  experience_years: number;
  qualifications: string[];
  specializations: string[];
  hourly_rate: number;
  availability: any;
  location: any;
  bio?: string;
  status: 'available' | 'assigned' | 'unavailable';
  verification_status: 'pending' | 'verified' | 'rejected';
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  // Student Operations
  static async getStudents(parentId: string): Promise<StudentProfile[]> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseStudentToProfile) || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  static async createStudent(
    studentData: Partial<StudentProfile>,
    parentId: string
  ): Promise<StudentProfile | null> {
    try {
      const dbStudent = {
        parent_id: parentId,
        name: studentData.name!,
        age: studentData.age!,
        country: studentData.country!,
        grade_level: studentData.grade!,
        grade_system: this.mapCountryToGradeSystem(studentData.country!),
        learning_preferences: {
          learning_style: studentData.learningStyle,
          special_needs: studentData.specialNeeds,
          interests: studentData.interests,
        },
        academic_standards: studentData.academicStandard,
        assigned_teachers: studentData.assignedTeachers || [],
        teacher_notes: studentData.teacherNotes || '',
      };

      const { data, error } = await supabase
        .from('students')
        .insert(dbStudent)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseStudentToProfile(data);
    } catch (error) {
      console.error('Error creating student:', error);
      return null;
    }
  }

  static async updateStudent(
    studentId: string,
    updates: Partial<StudentProfile>
  ): Promise<StudentProfile | null> {
    try {
      const dbUpdates: any = {};

      if (updates.name) {
        dbUpdates.name = updates.name;
      }
      if (updates.age) {
        dbUpdates.age = updates.age;
      }
      if (updates.country) {
        dbUpdates.country = updates.country;
      }
      if (updates.grade) {
        dbUpdates.grade_level = updates.grade;
      }
      if (updates.learningStyle || updates.specialNeeds || updates.interests) {
        dbUpdates.learning_preferences = {
          learning_style: updates.learningStyle,
          special_needs: updates.specialNeeds,
          interests: updates.interests,
        };
      }
      if (updates.academicStandard) {
        dbUpdates.academic_standards = updates.academicStandard;
      }
      if (updates.assignedTeachers) {
        dbUpdates.assigned_teachers = updates.assignedTeachers;
      }
      if (updates.teacherNotes) {
        dbUpdates.teacher_notes = updates.teacherNotes;
      }

      const { data, error } = await supabase
        .from('students')
        .update(dbUpdates)
        .eq('id', studentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseStudentToProfile(data);
    } catch (error) {
      console.error('Error updating student:', error);
      return null;
    }
  }

  static async deleteStudent(studentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  // Teacher Operations
  static async getTeachers(parentId: string): Promise<TeacherProfile[]> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseTeacherToProfile) || [];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  }

  static async createTeacher(
    teacherData: any,
    parentId: string
  ): Promise<TeacherProfile | null> {
    try {
      // For now, skip creating auth user to avoid rate limiting
      // Teachers can be added later with proper invitation flow
      // Set user_id to null since we're not creating auth accounts yet
      const dbTeacher = {
        user_id: null, // Nullable after migration 008
        parent_id: parentId,
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        subjects: teacherData.subjects,
        experience_years:
          teacherData.experience_years || parseInt(teacherData.experience) || 0,
        qualifications: teacherData.qualifications,
        specializations: teacherData.specializations || [],
        hourly_rate: parseFloat(teacherData.hourlyRate) || 0, // Keep for backward compatibility
        availability: teacherData.availability || { days: [], timeSlots: [] },
        location: teacherData.location || { address: '' },
        bio: teacherData.bio || '',
        status: 'available',
      };

      const { data, error } = await supabase
        .from('teachers')
        .insert(dbTeacher)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // If rates are provided, insert them into teacher_rates table
      if (
        teacherData.rates &&
        Array.isArray(teacherData.rates) &&
        teacherData.rates.length > 0
      ) {
        const ratesToInsert = teacherData.rates.map((rate: any) => ({
          teacher_id: data.id, // Use the teacher's database ID, not user_id
          subject: rate.subject,
          rate_type: rate.rate_type || 'hourly',
          rate_amount: rate.rate_amount,
          currency: rate.currency || 'USD',
          effective_date:
            rate.effective_date || new Date().toISOString().split('T')[0],
          notes: rate.notes || '',
          is_active: true,
        }));

        const { error: ratesError } = await supabase
          .from('teacher_rates')
          .insert(ratesToInsert);

        if (ratesError) {
          console.error('Error creating teacher rates:', ratesError);
          // Don't fail the entire operation, just log the error
        }
      }

      return this.mapDatabaseTeacherToProfile(data);
    } catch (error) {
      console.error('Error creating teacher:', error);
      return null;
    }
  }

  static async updateTeacher(
    teacherId: string,
    updates: Partial<TeacherProfile>
  ): Promise<TeacherProfile | null> {
    try {
      const dbUpdates: any = {};

      if (updates.name) {
        dbUpdates.name = updates.name;
      }
      if (updates.email) {
        dbUpdates.email = updates.email;
      }
      if (updates.subjects) {
        dbUpdates.subjects = updates.subjects;
      }
      if (updates.hourlyRate) {
        dbUpdates.hourly_rate = updates.hourlyRate;
      }
      if (updates.availability) {
        dbUpdates.availability = updates.availability;
      }
      if (updates.bio) {
        dbUpdates.bio = updates.bio;
      }

      const { data, error } = await supabase
        .from('teachers')
        .update(dbUpdates)
        .eq('id', teacherId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseTeacherToProfile(data);
    } catch (error) {
      console.error('Error updating teacher:', error);
      return null;
    }
  }

  static async deleteTeacher(teacherId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting teacher:', error);
      return false;
    }
  }

  // Helper methods
  private static mapDatabaseStudentToProfile(
    dbStudent: DatabaseStudent
  ): StudentProfile {
    return {
      id: dbStudent.id,
      name: dbStudent.name,
      age: dbStudent.age,
      grade: dbStudent.grade_level,
      country: dbStudent.country as any,
      academicStandard: dbStudent.academic_standards,
      selectedSubjects: [],
      selectedSocialization: [],
      selectedPhysicalEducation: [],
      selectedExtracurricular: [],
      selectedCommunityInvolvement: [],
      selectedSensoryActivities: [],
      selectedWritingActivities: [],
      selectedCommunicationActivities: [],
      selectedSocialActivities: [],
      selectedMotorActivities: [],
      selectedAcademicActivities: [],
      learningStyle: dbStudent.learning_preferences?.learning_style || '',
      specialNeeds: dbStudent.learning_preferences?.special_needs || '',
      interests: dbStudent.learning_preferences?.interests || '',
      assignedTeachers: dbStudent.assigned_teachers || [],
      teacherNotes: dbStudent.teacher_notes || '',
      parentId: dbStudent.parent_id,
      createdAt: new Date(dbStudent.created_at),
      updatedAt: new Date(dbStudent.updated_at),
    };
  }

  private static mapDatabaseTeacherToProfile(
    dbTeacher: DatabaseTeacher
  ): TeacherProfile {
    return {
      id: dbTeacher.id,
      userId: dbTeacher.user_id || undefined, // For session matching
      name: dbTeacher.name,
      email: dbTeacher.email,
      ...(dbTeacher.phone ? { phone: dbTeacher.phone } : {}),
      subjects: dbTeacher.subjects,
      experience: dbTeacher.experience_years,
      qualifications: dbTeacher.qualifications,
      specializations: dbTeacher.specializations,
      hourlyRate: dbTeacher.hourly_rate,
      availability: dbTeacher.availability,
      location: dbTeacher.location,
      ...(dbTeacher.bio ? { bio: dbTeacher.bio } : {}),
      parentId: dbTeacher.parent_id,
      createdAt: new Date(dbTeacher.created_at),
      updatedAt: new Date(dbTeacher.updated_at),
    };
  }

  private static mapCountryToGradeSystem(
    country: string
  ): 'uk_year' | 'us_grade' | 'india_class' {
    switch (country) {
      case 'UK':
        return 'uk_year';
      case 'US':
        return 'us_grade';
      case 'INDIA':
        return 'india_class';
      default:
        return 'uk_year';
    }
  }

  private static generatePassword(): string {
    return (
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8)
    );
  }

  // Student-Teacher Assignment Methods
  // Result type for assignment operations
  static readonly AssignmentResultType = {
    SUCCESS_WITH_QR: 'success_with_qr',
    SUCCESS_WITHOUT_QR: 'success_without_qr',
    FAILURE: 'failure',
  } as const;

  static async assignTeacherToStudent(
    teacherId: string,
    studentId: string,
    parentId: string
  ): Promise<{
    success: boolean;
    qrCodeCreated: boolean;
    message?: string;
  }> {
    try {
      // Update student's assigned teachers
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('assigned_teachers')
        .eq('id', studentId)
        .eq('parent_id', parentId)
        .single();

      if (studentError) {
        throw studentError;
      }

      const currentAssignments = student.assigned_teachers || [];
      if (!currentAssignments.includes(teacherId)) {
        const updatedAssignments = [...currentAssignments, teacherId];

        const { error: updateError } = await supabase
          .from('students')
          .update({ assigned_teachers: updatedAssignments })
          .eq('id', studentId);

        if (updateError) {
          throw updateError;
        }
      }

      // Create QR code for this teacher-student pair
      let qrCodeCreated = false;
      let qrErrorMessage: string | undefined;
      try {
        await TeacherQRService.createTeacherQRCodes(
          teacherId,
          [studentId],
          parentId
        );
        qrCodeCreated = true;
      } catch (qrError) {
        console.error('Error creating QR code for assignment:', qrError);
        qrErrorMessage =
          qrError instanceof Error
            ? qrError.message
            : 'QR code creation failed';
        // Don't fail the assignment if QR code creation fails
        // QR codes can be generated later when QR_SECRET is configured
      }

      // Log warning if QR code wasn't created
      if (!qrCodeCreated) {
        console.warn(
          'Teacher assigned but QR code was not created. ' +
            'Ensure QR_SECRET environment variable is configured. ' +
            'QR codes can be regenerated from the teacher profile.'
        );
      }

      return {
        success: true,
        qrCodeCreated,
        message: qrCodeCreated
          ? 'Teacher assigned and QR code created successfully'
          : `Teacher assigned but QR code was not created: ${qrErrorMessage || 'Unknown error'}. Please check server configuration.`,
      };
    } catch (error) {
      console.error('Error assigning teacher to student:', error);
      return {
        success: false,
        qrCodeCreated: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to assign teacher to student',
      };
    }
  }

  static async unassignTeacherFromStudent(
    teacherId: string,
    studentId: string,
    parentId: string
  ): Promise<boolean> {
    try {
      // Update student's assigned teachers
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('assigned_teachers')
        .eq('id', studentId)
        .eq('parent_id', parentId)
        .single();

      if (studentError) {
        throw studentError;
      }

      const currentAssignments = student.assigned_teachers || [];
      const updatedAssignments = currentAssignments.filter(
        (id: any) => id !== teacherId
      );

      const { error: updateError } = await supabase
        .from('students')
        .update({ assigned_teachers: updatedAssignments })
        .eq('id', studentId);

      if (updateError) {
        throw updateError;
      }

      // Deactivate QR codes for this teacher-student pair
      try {
        const qrCodes = await TeacherQRService.getTeacherQRCodes(teacherId);
        const studentQRCodes = qrCodes.filter(
          qr => qr.student_id === studentId
        );

        for (const qrCode of studentQRCodes) {
          await TeacherQRService.deactivateQRCode(qrCode.id);
        }
      } catch (qrError) {
        console.error('Error deactivating QR codes for unassignment:', qrError);
        // Don't fail the unassignment if QR code deactivation fails
      }

      return true;
    } catch (error) {
      console.error('Error unassigning teacher from student:', error);
      return false;
    }
  }

  static async getStudentAssignments(studentId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('assigned_teachers')
        .eq('id', studentId)
        .single();

      if (error) {
        throw error;
      }

      return data.assigned_teachers || [];
    } catch (error) {
      console.error('Error getting student assignments:', error);
      return [];
    }
  }

  static async getTeacherAssignments(teacherId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, assigned_teachers')
        .contains('assigned_teachers', [teacherId]);

      if (error) {
        throw error;
      }

      return data.map((student: any) => student.id);
    } catch (error) {
      console.error('Error getting teacher assignments:', error);
      return [];
    }
  }
}
