import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase';

export function createSupabaseServerClient(cookies: {
  get: (name: string) => { name: string; value: string } | undefined;
  set: (
    name: string,
    value: string,
    options: { path?: string; maxAge?: number }
  ) => void;
  remove: (name: string, options: { path?: string }) => void;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies,
  });
}
