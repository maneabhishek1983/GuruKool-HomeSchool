// Country-based syllabus service

import {
  CountryCode,
  Country,
  Grade,
  AcademicStandard,
  Student,
  COUNTRIES,
} from '@/types/syllabus.types';
import { supabase } from '@/lib/supabase';

export class SyllabusService {
  /**
   * Get all available countries
   */
  static getAvailableCountries(): Country[] {
    return Object.values(COUNTRIES);
  }

  /**
   * Get country configuration by code
   */
  static getCountryByCode(code: CountryCode): Country {
    return COUNTRIES[code];
  }

  /**
   * Get grades for a specific country
   */
  static getGradesByCountry(countryCode: CountryCode): Grade[] {
    return COUNTRIES[countryCode]?.grades || [];
  }

  /**
   * Get appropriate grade for age and country
   */
  static getGradeForAge(age: number, countryCode: CountryCode): Grade | null {
    const grades = this.getGradesByCountry(countryCode);
    return (
      grades.find(
        grade => age >= grade.ageRange.min && age <= grade.ageRange.max
      ) || null
    );
  }

  /**
   * Get academic standards for a country, grade, and subject
   */
  static async getAcademicStandards(
    country: CountryCode,
    gradeLevel: string,
    subject?: string
  ): Promise<AcademicStandard[]> {
    try {
      let query = supabase
        .from('academic_standards')
        .select('*')
        .eq('country', country)
        .eq('grade_level', gradeLevel);

      if (subject) {
        query = query.eq('subject', subject);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching academic standards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAcademicStandards:', error);
      return [];
    }
  }

  /**
   * Get all subjects for a country and grade
   */
  static async getSubjectsForGrade(
    country: CountryCode,
    gradeLevel: string
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('academic_standards')
        .select('subject')
        .eq('country', country)
        .eq('grade_level', gradeLevel);

      if (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }

      return [...new Set(data?.map(item => item.subject) || [])];
    } catch (error) {
      console.error('Error in getSubjectsForGrade:', error);
      return [];
    }
  }

  /**
   * Create a new student with country-specific settings
   */
  static async createStudent(
    studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Student | null> {
    try {
      // Validate age against grade
      const suggestedGrade = this.getGradeForAge(
        studentData.age,
        studentData.country
      );
      if (!suggestedGrade) {
        throw new Error(
          `No appropriate grade found for age ${studentData.age} in ${studentData.country}`
        );
      }

      // Get academic standards for the grade
      const standards = await this.getAcademicStandards(
        studentData.country,
        studentData.gradeLevel
      );

      const academicStandards: Record<string, string[]> = {};
      standards.forEach(standard => {
        if (!academicStandards[standard.subject]) {
          academicStandards[standard.subject] = [];
        }
        academicStandards[standard.subject].push(
          ...standard.standards.map(s => s.code)
        );
      });

      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            ...studentData,
            academic_standards: academicStandards,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating student:', error);
        return null;
      }

      return this.formatStudentData(data);
    } catch (error) {
      console.error('Error in createStudent:', error);
      return null;
    }
  }

  /**
   * Update student with new grade/country settings
   */
  static async updateStudentGrade(
    studentId: string,
    newGradeLevel: string,
    newCountry?: CountryCode
  ): Promise<Student | null> {
    try {
      const updates: any = {
        grade_level: newGradeLevel,
        grade_system: newCountry
          ? COUNTRIES[newCountry].gradeSystem
          : undefined,
      };

      if (newCountry) {
        updates.country = newCountry;

        // Update academic standards for new country/grade
        const standards = await this.getAcademicStandards(
          newCountry,
          newGradeLevel
        );
        const academicStandards: Record<string, string[]> = {};
        standards.forEach(standard => {
          if (!academicStandards[standard.subject]) {
            academicStandards[standard.subject] = [];
          }
          academicStandards[standard.subject].push(
            ...standard.standards.map(s => s.code)
          );
        });
        updates.academic_standards = academicStandards;
      }

      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating student grade:', error);
        return null;
      }

      return this.formatStudentData(data);
    } catch (error) {
      console.error('Error in updateStudentGrade:', error);
      return null;
    }
  }

  /**
   * Get students by parent ID
   */
  static async getStudentsByParent(parentId: string): Promise<Student[]> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', parentId);

      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }

      return data?.map(this.formatStudentData) || [];
    } catch (error) {
      console.error('Error in getStudentsByParent:', error);
      return [];
    }
  }

  /**
   * Get student by ID
   */
  static async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('Error fetching student:', error);
        return null;
      }

      return this.formatStudentData(data);
    } catch (error) {
      console.error('Error in getStudentById:', error);
      return null;
    }
  }

  /**
   * Validate student data against country standards
   */
  static validateStudentData(student: Partial<Student>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check if age matches grade
    if (student.age && student.country && student.gradeLevel) {
      const suggestedGrade = this.getGradeForAge(student.age, student.country);
      if (suggestedGrade && suggestedGrade.level !== student.gradeLevel) {
        suggestions.push(
          `Age ${student.age} typically corresponds to ${suggestedGrade.level} in ${student.country}`
        );
      }
    }

    // Check if grade system matches country
    if (student.country && student.gradeSystem) {
      const countryGradeSystem = COUNTRIES[student.country].gradeSystem;
      if (student.gradeSystem !== countryGradeSystem) {
        errors.push(
          `Grade system ${student.gradeSystem} does not match ${student.country}'s system (${countryGradeSystem})`
        );
      }
    }

    // Check if grade exists in country
    if (student.country && student.gradeLevel) {
      const availableGrades = this.getGradesByCountry(student.country);
      const gradeExists = availableGrades.some(
        grade => grade.level === student.gradeLevel
      );
      if (!gradeExists) {
        errors.push(
          `Grade ${student.gradeLevel} is not available in ${student.country}. Available grades: ${availableGrades.map(g => g.level).join(', ')}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Get learning progression path for a student
   */
  static async getLearningProgression(
    studentId: string,
    subject: string
  ): Promise<{
    current: AcademicStandard[];
    next: AcademicStandard[];
    previous: AcademicStandard[];
  }> {
    try {
      const student = await this.getStudentById(studentId);
      if (!student) {
        return { current: [], next: [], previous: [] };
      }

      const [current, next, previous] = await Promise.all([
        this.getAcademicStandards(student.country, student.gradeLevel, subject),
        this.getNextGradeStandards(student, subject),
        this.getPreviousGradeStandards(student, subject),
      ]);

      return { current, next, previous };
    } catch (error) {
      console.error('Error in getLearningProgression:', error);
      return { current: [], next: [], previous: [] };
    }
  }

  /**
   * Get standards for next grade level
   */
  private static async getNextGradeStandards(
    student: Student,
    subject: string
  ): Promise<AcademicStandard[]> {
    const grades = this.getGradesByCountry(student.country);
    const currentIndex = grades.findIndex(g => g.level === student.gradeLevel);

    if (currentIndex >= 0 && currentIndex < grades.length - 1) {
      const nextGrade = grades[currentIndex + 1];
      return this.getAcademicStandards(
        student.country,
        nextGrade.level,
        subject
      );
    }

    return [];
  }

  /**
   * Get standards for previous grade level
   */
  private static async getPreviousGradeStandards(
    student: Student,
    subject: string
  ): Promise<AcademicStandard[]> {
    const grades = this.getGradesByCountry(student.country);
    const currentIndex = grades.findIndex(g => g.level === student.gradeLevel);

    if (currentIndex > 0) {
      const previousGrade = grades[currentIndex - 1];
      return this.getAcademicStandards(
        student.country,
        previousGrade.level,
        subject
      );
    }

    return [];
  }

  /**
   * Format database student data to application format
   */
  private static formatStudentData(data: any): Student {
    return {
      id: data.id,
      parentId: data.parent_id,
      name: data.name,
      age: data.age,
      country: data.country,
      gradeLevel: data.grade_level,
      gradeSystem: data.grade_system,
      birthDate: data.birth_date,
      learningPreferences: data.learning_preferences || {},
      specialNeeds: data.special_needs || [],
      academicStandards: data.academic_standards || {},
      profilePictureUrl: data.profile_picture_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get grade recommendations based on assessment
   */
  static async getGradeRecommendations(
    age: number,
    country: CountryCode,
    assessmentResults?: Record<string, number>
  ): Promise<{
    recommended: Grade;
    alternatives: Grade[];
    reasoning: string;
  }> {
    const grades = this.getGradesByCountry(country);
    const ageBasedGrade = this.getGradeForAge(age, country);

    if (!ageBasedGrade) {
      throw new Error(`No grade available for age ${age} in ${country}`);
    }

    const recommended = ageBasedGrade;
    const alternatives: Grade[] = [];

    // If assessment results are provided, adjust recommendation
    if (assessmentResults) {
      const averageScore =
        Object.values(assessmentResults).reduce(
          (sum, score) => sum + score,
          0
        ) / Object.values(assessmentResults).length;

      if (averageScore > 80) {
        // High performer - suggest next grade if available
        const currentIndex = grades.findIndex(
          g => g.level === ageBasedGrade.level
        );
        if (currentIndex < grades.length - 1) {
          alternatives.push(grades[currentIndex + 1]);
        }
      } else if (averageScore < 60) {
        // May need support - suggest previous grade if available
        const currentIndex = grades.findIndex(
          g => g.level === ageBasedGrade.level
        );
        if (currentIndex > 0) {
          alternatives.push(grades[currentIndex - 1]);
        }
      }
    }

    return {
      recommended,
      alternatives,
      reasoning: assessmentResults
        ? `Based on age ${age} and assessment performance (avg: ${Object.values(assessmentResults).reduce((sum, score) => sum + score, 0) / Object.values(assessmentResults).length}%)`
        : `Based on age ${age} for ${country} education system`,
    };
  }
}
