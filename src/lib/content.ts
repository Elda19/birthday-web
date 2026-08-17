import type { Content, Memory, Settings, Song } from './types';
import { EMPTY_CONTENT, EMPTY_SETTINGS, EMPTY_SONG } from './types';
import { getPublicClient, isSupabaseConfigured } from './supabase/server';

/**
 * Reads the whole birthday site from the database.
 * Never throws - a broken or unconfigured backend still renders a page.
 */
export async function fetchContent(): Promise<Content> {
  if (!isSupabaseConfigured) return { ...EMPTY_CONTENT, notConfigured: true };

  try {
    const supabase = getPublicClient();
    const [settingsRes, songRes, memoriesRes] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('song').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('memories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    return {
      settings: { ...EMPTY_SETTINGS, ...((settingsRes.data ?? {}) as Partial<Settings>) },
      song: { ...EMPTY_SONG, ...((songRes.data ?? {}) as Partial<Song>) },
      memories: (memoriesRes.data ?? []) as Memory[],
    };
  } catch {
    return EMPTY_CONTENT;
  }
}
