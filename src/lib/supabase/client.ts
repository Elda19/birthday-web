'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

let cached: ReturnType<typeof createBrowserClient> | null = null;

/** Browser-side Supabase client. Sessions are kept in cookies so the server
 *  can also see whether you are logged in. */
export function getBrowserClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local',
    );
  }
  if (!cached) cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
