import { createClient } from '@supabase/supabase-js';
import { StudentProfile, TeacherProfile } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      // First create a user account for the teacher
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: teacherData.email,
        password: this.generatePassword(), // Generate a random password
        options: {
          data: {
            name: teacherData.name,
            role: 'teacher',
          },
        },
      });

      if (userError) {
        throw userError;
      }

      const dbTeacher = {
        user_id: userData.user!.id,
        parent_id: parentId,
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        subjects: teacherData.subjects,
        experience_years: parseInt(teacherData.experience) || 0,
        qualifications: teacherData.qualifications,
        specializations: teacherData.specializations,
        hourly_rate: parseFloat(teacherData.hourlyRate) || 0,
        availability: teacherData.availability,
        location: teacherData.location,
        bio: teacherData.bio,
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
      country: dbStudent.country,
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
      name: dbTeacher.name,
      email: dbTeacher.email,
      phone: dbTeacher.phone,
      subjects: dbTeacher.subjects,
      experience: dbTeacher.experience_years,
      qualifications: dbTeacher.qualifications,
      specializations: dbTeacher.specializations,
      hourlyRate: dbTeacher.hourly_rate,
      availability: dbTeacher.availability,
      location: dbTeacher.location,
      bio: dbTeacher.bio,
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
}
