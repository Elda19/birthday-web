/* Shapes of the three content tables. Kept in one place so the public site and
   Admin Mode can never drift apart. */

export type Settings = {
  friend_name: string;
  birthday_date: string;

  intro_title: string;
  intro_message: string;
  intro_emoticon: string;
  intro_button_label: string;
  intro_media_url: string | null;
  intro_media_alt: string;

  accent_color: string;

  memories_heading: string;
  memories_subheading: string;

  song_heading: string;

  letter_heading: string;
  letter_card_url: string | null;
  letter_card_alt: string;
  letter_card_caption: string;
  letter_greeting: string;
  letter_text: string;
  letter_signature: string;

  finale_text: string;
  finale_emojis: string;
  finale_celebrate_label: string;
  finale_start_over_label: string;
  footer_text: string;

  background_audio_url: string | null;
};

export type SongSourceType = 'none' | 'youtube' | 'spotify' | 'file';

export type Song = {
  title: string;
  artist: string;
  source_type: SongSourceType;
  source_url: string;
  personal_message: string;
};

export type Memory = {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url: string | null;
  storage_path: string | null;
  poster_path: string | null;
  alt_text: string;
  caption: string;
  location: string;
  memory_date: string;
  autoplay_muted: boolean;
  sort_order: number;
};

export type Content = {
  settings: Settings;
  song: Song;
  memories: Memory[];
  /** True when Supabase is not configured yet, so the UI can explain itself. */
  notConfigured?: boolean;
};

/* A brand new, deliberately blank site. Nothing is shipped as content - every
   value below is replaced from Admin Mode. */
export const EMPTY_SETTINGS: Settings = {
  friend_name: '',
  birthday_date: '',
  intro_title: '',
  intro_message: '',
  intro_emoticon: '',
  intro_button_label: 'Next!! ^w^',
  intro_media_url: null,
  intro_media_alt: '',
  accent_color: '#2563eb',
  memories_heading: 'Memories 📸',
  memories_subheading: '',
  song_heading: 'A Song Just For You',
  letter_heading: 'A Letter for You 💌',
  letter_card_url: null,
  letter_card_alt: '',
  letter_card_caption: 'Happy Birthday!',
  letter_greeting: '',
  letter_text: '',
  letter_signature: '',
  finale_text: '',
  finale_emojis: '💙 🎂 💙',
  finale_celebrate_label: 'Celebrate 🎉',
  finale_start_over_label: 'Start Over 💙',
  footer_text: '',
  background_audio_url: null,
};

export const EMPTY_SONG: Song = {
  title: '',
  artist: '',
  source_type: 'none',
  source_url: '',
  personal_message: '',
};

export const EMPTY_CONTENT: Content = {
  settings: EMPTY_SETTINGS,
  song: EMPTY_SONG,
  memories: [],
};
