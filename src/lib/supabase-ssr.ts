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

  // Adapt cookies to match @supabase/ssr expected interface
  const cookieAdapter = {
    get(name: string) {
      const cookie = cookies.get(name);
      return cookie?.value ?? null;
    },
    set(name: string, value: string, options: any) {
      cookies.set(name, value, options);
    },
    remove(name: string, options: any) {
      cookies.remove(name, options);
    },
    getAll() {
      // Not supported by this cookie implementation
      return [];
    },
  };

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
  });
}
