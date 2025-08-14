import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client for browser
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Create admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'parent' | 'teacher' | 'admin';
          preferences: any;
          created_at: string;
          updated_at: string;
          last_active: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'parent' | 'teacher' | 'admin';
          preferences?: any;
          created_at?: string;
          updated_at?: string;
          last_active?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'parent' | 'teacher' | 'admin';
          preferences?: any;
          updated_at?: string;
          last_active?: string;
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
          location: any;
          status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
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
          location: any;
          status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
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
          location?: any;
          status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
          notes?: string | null;
          updated_at?: string;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          type: 'progress' | 'recommendation' | 'alert' | 'prediction';
          content: string;
          confidence: number;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          type: 'progress' | 'recommendation' | 'alert' | 'prediction';
          content: string;
          confidence: number;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          type?: 'progress' | 'recommendation' | 'alert' | 'prediction';
          content?: string;
          confidence?: number;
          metadata?: any;
        };
      };
      auth_sessions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          token_data: any;
          ai_context: any | null;
          risk_score: number;
          status: 'pending' | 'success' | 'expired' | 'failed';
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          token_data: any;
          ai_context?: any | null;
          risk_score?: number;
          status?: 'pending' | 'success' | 'expired' | 'failed';
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          token_data?: any;
          ai_context?: any | null;
          risk_score?: number;
          status?: 'pending' | 'success' | 'expired' | 'failed';
          expires_at?: string;
          updated_at?: string;
        };
      };
      learning_analytics: {
        Row: {
          id: string;
          student_id: string;
          subject: string;
          progress_metrics: any;
          learning_patterns: any;
          recommendations: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject: string;
          progress_metrics: any;
          learning_patterns: any;
          recommendations: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject?: string;
          progress_metrics?: any;
          learning_patterns?: any;
          recommendations?: any;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'parent' | 'teacher' | 'admin';
      session_status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
      auth_status: 'pending' | 'success' | 'expired' | 'failed';
      insight_type: 'progress' | 'recommendation' | 'alert' | 'prediction';
    };
  };
}