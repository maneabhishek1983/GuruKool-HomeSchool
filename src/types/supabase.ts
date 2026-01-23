/**
 * Supabase Database Types
 *
 * This file contains TypeScript type definitions for the Supabase database schema.
 * In a production environment, these types should be auto-generated using:
 * npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
 *
 * These types are manually maintained to match the migrations in supabase/migrations/
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// Table Row Types (what you get when querying)
// ============================================================================

/**
 * Student record with geofencing fields (migration 015)
 */
export interface StudentRow {
  id: string;
  name: string;
  age?: number;
  grade?: string;
  parent_id: string;
  home_address?: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  geofence_radius_meters?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Teacher biometric credential (migration 015)
 */
export interface TeacherBiometricCredentialRow {
  id: string;
  teacher_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name?: string | null;
  device_type?: 'ios' | 'android' | 'web' | 'other' | null;
  created_at?: string;
  last_used_at?: string | null;
  is_active: boolean;
}

/**
 * Teacher session with location tracking (migration 015)
 */
export interface TeacherSessionRow {
  id: string;
  teacher_id: string;
  student_id: string;
  checked_in_at: string;
  checked_out_at?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_in_accuracy_meters?: number | null;
  check_in_address?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_accuracy_meters?: number | null;
  check_out_address?: string | null;
  location_verified?: boolean;
  biometric_verified?: boolean;
  verification_method?:
    | 'qr_code'
    | 'biometric'
    | 'biometric_location'
    | 'exception'
    | null;
  check_in_distance_meters?: number | null;
  check_out_distance_meters?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Geofence exception request (migration 015)
 */
export interface GeofenceExceptionRow {
  id: string;
  teacher_id: string;
  student_id: string;
  parent_id: string;
  reason: string;
  alternate_location?: string | null;
  alternate_latitude?: number | null;
  alternate_longitude?: number | null;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approved_by?: string | null;
  approved_at?: string | null;
  denial_reason?: string | null;
  valid_from: string;
  valid_until: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Location verification log (migration 015)
 */
export interface LocationVerificationLogRow {
  id: string;
  teacher_id: string;
  student_id: string;
  session_id?: string | null;
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
  distance_meters: number;
  within_geofence: boolean;
  geofence_radius_meters: number;
  verification_type: 'check_in' | 'check_out' | 'manual_check';
  success: boolean;
  error_message?: string | null;
  created_at?: string;
}

/**
 * Teacher record
 */
export interface TeacherRow {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  subjects?: string[];
  qualifications?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * User record
 */
export interface UserRow {
  id: string;
  email: string;
  name?: string | null;
  role?: 'parent' | 'teacher' | 'admin';
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Insert Types (what you provide when inserting)
// ============================================================================

export interface TeacherBiometricCredentialInsert {
  id?: string;
  teacher_id: string;
  credential_id: string;
  public_key: string;
  counter?: number;
  device_name?: string | null;
  device_type?: 'ios' | 'android' | 'web' | 'other' | null;
  created_at?: string;
  last_used_at?: string | null;
  is_active?: boolean;
}

export interface TeacherSessionInsert {
  id?: string;
  teacher_id: string;
  student_id: string;
  checked_in_at: string;
  checked_out_at?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_in_accuracy_meters?: number | null;
  check_in_address?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_accuracy_meters?: number | null;
  check_out_address?: string | null;
  location_verified?: boolean;
  biometric_verified?: boolean;
  verification_method?:
    | 'qr_code'
    | 'biometric'
    | 'biometric_location'
    | 'exception'
    | null;
  check_in_distance_meters?: number | null;
  check_out_distance_meters?: number | null;
}

export interface GeofenceExceptionInsert {
  id?: string;
  teacher_id: string;
  student_id: string;
  parent_id: string;
  reason: string;
  alternate_location?: string | null;
  alternate_latitude?: number | null;
  alternate_longitude?: number | null;
  status?: 'pending' | 'approved' | 'denied' | 'expired';
  approved_by?: string | null;
  approved_at?: string | null;
  denial_reason?: string | null;
  valid_from: string;
  valid_until: string;
  created_at?: string;
}

export interface LocationVerificationLogInsert {
  id?: string;
  teacher_id: string;
  student_id: string;
  session_id?: string | null;
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
  distance_meters: number;
  within_geofence: boolean;
  geofence_radius_meters: number;
  verification_type: 'check_in' | 'check_out' | 'manual_check';
  success: boolean;
  error_message?: string | null;
}

// ============================================================================
// Update Types (what you provide when updating)
// ============================================================================

export interface TeacherBiometricCredentialUpdate {
  last_used_at?: string | null;
  counter?: number;
  is_active?: boolean;
  device_name?: string | null;
}

export interface GeofenceExceptionUpdate {
  status?: 'pending' | 'approved' | 'denied' | 'expired';
  approved_by?: string | null;
  approved_at?: string | null;
  denial_reason?: string | null;
  updated_at?: string;
}

export interface TeacherSessionUpdate {
  checked_out_at?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_accuracy_meters?: number | null;
  check_out_address?: string | null;
  check_out_distance_meters?: number | null;
}

// ============================================================================
// Join Types (for queries with relations)
// ============================================================================

export interface GeofenceExceptionWithStudent extends GeofenceExceptionRow {
  students: Pick<StudentRow, 'parent_id' | 'name'>;
}

export interface GeofenceExceptionWithTeacher extends GeofenceExceptionRow {
  teachers: Pick<TeacherRow, 'user_id'> & {
    users?: Pick<UserRow, 'email'>;
  };
}

// ============================================================================
// Database Schema Type (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      students: {
        Row: StudentRow;
        Insert: Partial<StudentRow> & Pick<StudentRow, 'name' | 'parent_id'>;
        Update: Partial<StudentRow>;
      };
      teacher_biometric_credentials: {
        Row: TeacherBiometricCredentialRow;
        Insert: TeacherBiometricCredentialInsert;
        Update: TeacherBiometricCredentialUpdate;
      };
      teacher_sessions: {
        Row: TeacherSessionRow;
        Insert: TeacherSessionInsert;
        Update: TeacherSessionUpdate;
      };
      geofence_exceptions: {
        Row: GeofenceExceptionRow;
        Insert: GeofenceExceptionInsert;
        Update: GeofenceExceptionUpdate;
      };
      location_verification_log: {
        Row: LocationVerificationLogRow;
        Insert: LocationVerificationLogInsert;
        Update: never;
      };
      teachers: {
        Row: TeacherRow;
        Insert: Partial<TeacherRow> & Pick<TeacherRow, 'name'>;
        Update: Partial<TeacherRow>;
      };
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & Pick<UserRow, 'email'>;
        Update: Partial<UserRow>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_distance: {
        Args: {
          lat1: number;
          lon1: number;
          lat2: number;
          lon2: number;
        };
        Returns: number;
      };
      is_within_geofence: {
        Args: {
          teacher_lat: number;
          teacher_lon: number;
          student_id: string;
        };
        Returns: {
          within_geofence: boolean;
          distance_meters: number;
          geofence_radius_meters: number;
        };
      };
    };
    Enums: Record<string, never>;
  };
}
