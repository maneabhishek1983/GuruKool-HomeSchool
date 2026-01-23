/**
 * Supabase Database Types
 *
 * This file contains TypeScript type definitions for the Supabase database schema.
 * In a production environment, these types should be auto-generated using:
 * npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
 *
 * These types are manually maintained to match the database schema defined in
 * supabase/migrations/*.sql files.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types matching database enums
export type UserRole = 'parent' | 'teacher' | 'admin';
export type SessionStatus =
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled';
export type AuthStatus = 'pending' | 'success' | 'expired' | 'failed';
export type InsightType =
  | 'progress'
  | 'recommendation'
  | 'alert'
  | 'prediction';
export type CountryCode = 'UK' | 'US' | 'IN';
export type GradeSystem = 'UK' | 'US' | 'IN';
export type GeofenceExceptionStatus = 'pending' | 'approved' | 'denied';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          preferences: Json;
          created_at: string;
          updated_at: string;
          last_active: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: UserRole;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          last_active?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          last_active?: string;
        };
      };
      students: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          age: number;
          country: CountryCode;
          grade_level: string;
          grade_system: GradeSystem;
          birth_date: string | null;
          learning_preferences: Json;
          special_needs: Json;
          academic_standards: Json;
          profile_picture_url: string | null;
          home_latitude: number | null;
          home_longitude: number | null;
          home_address: string | null;
          geofence_radius_meters: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          age: number;
          country?: CountryCode;
          grade_level: string;
          grade_system: GradeSystem;
          birth_date?: string | null;
          learning_preferences?: Json;
          special_needs?: Json;
          academic_standards?: Json;
          profile_picture_url?: string | null;
          home_latitude?: number | null;
          home_longitude?: number | null;
          home_address?: string | null;
          geofence_radius_meters?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          age?: number;
          country?: CountryCode;
          grade_level?: string;
          grade_system?: GradeSystem;
          birth_date?: string | null;
          learning_preferences?: Json;
          special_needs?: Json;
          academic_standards?: Json;
          profile_picture_url?: string | null;
          home_latitude?: number | null;
          home_longitude?: number | null;
          home_address?: string | null;
          geofence_radius_meters?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          user_id: string | null;
          parent_id: string;
          name: string;
          email: string;
          phone: string | null;
          subjects: string[];
          qualifications: Json;
          availability: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          parent_id: string;
          name: string;
          email: string;
          phone?: string | null;
          subjects?: string[];
          qualifications?: Json;
          availability?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          parent_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subjects?: string[];
          qualifications?: Json;
          availability?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          parent_id: string;
          subject: string;
          scheduled_start: string;
          scheduled_end: string;
          actual_start: string | null;
          actual_end: string | null;
          location: Json;
          status: SessionStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          parent_id: string;
          subject: string;
          scheduled_start: string;
          scheduled_end: string;
          actual_start?: string | null;
          actual_end?: string | null;
          location?: Json;
          status?: SessionStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          parent_id?: string;
          subject?: string;
          scheduled_start?: string;
          scheduled_end?: string;
          actual_start?: string | null;
          actual_end?: string | null;
          location?: Json;
          status?: SessionStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teacher_sessions: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string;
          checked_in_at: string;
          checked_out_at: string | null;
          check_in_latitude: number | null;
          check_in_longitude: number | null;
          check_in_accuracy_meters: number | null;
          check_in_distance_meters: number | null;
          check_out_latitude: number | null;
          check_out_longitude: number | null;
          check_out_accuracy_meters: number | null;
          check_out_distance_meters: number | null;
          location_verified: boolean;
          biometric_verified: boolean;
          verification_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id: string;
          checked_in_at: string;
          checked_out_at?: string | null;
          check_in_latitude?: number | null;
          check_in_longitude?: number | null;
          check_in_accuracy_meters?: number | null;
          check_in_distance_meters?: number | null;
          check_out_latitude?: number | null;
          check_out_longitude?: number | null;
          check_out_accuracy_meters?: number | null;
          check_out_distance_meters?: number | null;
          location_verified?: boolean;
          biometric_verified?: boolean;
          verification_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          student_id?: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          check_in_latitude?: number | null;
          check_in_longitude?: number | null;
          check_in_accuracy_meters?: number | null;
          check_in_distance_meters?: number | null;
          check_out_latitude?: number | null;
          check_out_longitude?: number | null;
          check_out_accuracy_meters?: number | null;
          check_out_distance_meters?: number | null;
          location_verified?: boolean;
          biometric_verified?: boolean;
          verification_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teacher_biometric_credentials: {
        Row: {
          id: string;
          teacher_id: string;
          credential_id: string;
          public_key: string;
          device_name: string;
          device_type: string;
          counter: number;
          is_active: boolean;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          credential_id: string;
          public_key: string;
          device_name?: string;
          device_type?: string;
          counter?: number;
          is_active?: boolean;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          credential_id?: string;
          public_key?: string;
          device_name?: string;
          device_type?: string;
          counter?: number;
          is_active?: boolean;
          created_at?: string;
          last_used_at?: string | null;
        };
      };
      geofence_exceptions: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string;
          parent_id: string;
          reason: string;
          alternate_location: string | null;
          alternate_latitude: number | null;
          alternate_longitude: number | null;
          status: GeofenceExceptionStatus;
          valid_from: string;
          valid_until: string;
          approved_by: string | null;
          approved_at: string | null;
          denial_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id: string;
          parent_id: string;
          reason: string;
          alternate_location?: string | null;
          alternate_latitude?: number | null;
          alternate_longitude?: number | null;
          status?: GeofenceExceptionStatus;
          valid_from: string;
          valid_until: string;
          approved_by?: string | null;
          approved_at?: string | null;
          denial_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          student_id?: string;
          parent_id?: string;
          reason?: string;
          alternate_location?: string | null;
          alternate_latitude?: number | null;
          alternate_longitude?: number | null;
          status?: GeofenceExceptionStatus;
          valid_from?: string;
          valid_until?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          denial_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      location_verification_log: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string;
          session_id: string | null;
          latitude: number;
          longitude: number;
          accuracy_meters: number;
          distance_meters: number;
          within_geofence: boolean;
          geofence_radius_meters: number;
          verification_type: string;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id: string;
          session_id?: string | null;
          latitude: number;
          longitude: number;
          accuracy_meters: number;
          distance_meters: number;
          within_geofence: boolean;
          geofence_radius_meters: number;
          verification_type: string;
          success: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          student_id?: string;
          session_id?: string | null;
          latitude?: number;
          longitude?: number;
          accuracy_meters?: number;
          distance_meters?: number;
          within_geofence?: boolean;
          geofence_radius_meters?: number;
          verification_type?: string;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
      };
      teacher_qr_codes: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string;
          qr_code_data: string;
          expires_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id: string;
          qr_code_data: string;
          expires_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          student_id?: string;
          qr_code_data?: string;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      teacher_invitation_tokens: {
        Row: {
          id: string;
          parent_id: string;
          teacher_email: string;
          token: string;
          message: string | null;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          teacher_email: string;
          token: string;
          message?: string | null;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          teacher_email?: string;
          token?: string;
          message?: string | null;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
      };
      auth_sessions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          token_data: Json;
          ai_context: Json | null;
          risk_score: number;
          status: AuthStatus;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          token_data: Json;
          ai_context?: Json | null;
          risk_score?: number;
          status?: AuthStatus;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          token_data?: Json;
          ai_context?: Json | null;
          risk_score?: number;
          status?: AuthStatus;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          type: InsightType;
          content: string;
          confidence: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          type: InsightType;
          content: string;
          confidence: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          type?: InsightType;
          content?: string;
          confidence?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
      learning_analytics: {
        Row: {
          id: string;
          student_id: string;
          subject: string;
          progress_metrics: Json;
          learning_patterns: Json;
          recommendations: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject: string;
          progress_metrics?: Json;
          learning_patterns?: Json;
          recommendations?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject?: string;
          progress_metrics?: Json;
          learning_patterns?: Json;
          recommendations?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      cleanup_expired_auth_sessions: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_user_session_stats: {
        Args: {
          user_uuid: string;
          user_role_param: UserRole;
        };
        Returns: {
          total_sessions: number;
          completed_sessions: number;
          upcoming_sessions: number;
          completion_rate: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      session_status: SessionStatus;
      auth_status: AuthStatus;
      insight_type: InsightType;
      country_code: CountryCode;
      grade_system: GradeSystem;
      geofence_exception_status: GeofenceExceptionStatus;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
