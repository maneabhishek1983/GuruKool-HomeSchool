/**
 * Supabase Database Types
 *
 * This file contains TypeScript type definitions for the Supabase database schema.
 * In a production environment, these types should be auto-generated using:
 * npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
 *
 * For now, we use a generic Database type that allows any schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
  };
}
