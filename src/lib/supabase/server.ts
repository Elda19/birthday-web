import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

/** Server client that can read the visitor's session from cookies. */
export function getServerClient() {
  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* Called from a Server Component - safe to ignore. */
        }
      },
    },
  });
}

/** Plain anonymous client for reading public content. No session involved. */
export function getPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { isSupabaseConfigured };
