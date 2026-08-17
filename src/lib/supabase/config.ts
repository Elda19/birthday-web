/* Environment values are read once and cleaned up here, so a stray space or a
   trailing slash pasted into a hosting dashboard cannot break the site. */

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();

export const SUPABASE_URL = rawUrl.replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

/** Lets the app show a friendly setup screen instead of crashing. */
export const isSupabaseConfigured =
  /^https?:\/\/.+/i.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 0;

export const MEDIA_BUCKET = 'media';
