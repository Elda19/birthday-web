'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Content, Memory, Settings, Song, SongSourceType } from '@/lib/types';
import { EMPTY_SETTINGS, EMPTY_SONG } from '@/lib/types';
import { getBrowserClient } from '@/lib/supabase/client';
import MediaUploadField from './MediaUploadField';
import MemoriesManager from './MemoriesManager';
import {
  Button,
  Card,
  Field,
  SectionTitle,
  Select,
  StatusLine,
  TextArea,
  TextInput,
  type StatusKind,
} from './ui';

const TABS = ['Website', 'Memories', 'Music', 'Letter', 'Finale'] as const;
type Tab = (typeof TABS)[number];

export default function AdminApp({
  initial,
  email,
}: {
  initial: Content;
  email: string | null;
}) {
  const [tab, setTab] = useState<Tab>('Website');
  const [settings, setSettings] = useState<Settings>({ ...EMPTY_SETTINGS, ...initial.settings });
  const [song, setSong] = useState<Song>({ ...EMPTY_SONG, ...initial.song });
  const [memories, setMemories] = useState<Memory[]>(initial.memories);
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({
    kind: 'idle',
    message: '',
  });

  const set = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const refreshMemories = useCallback(async () => {
    const supabase = getBrowserClient();
    const { data } = await supabase
      .from('memories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    setMemories((data ?? []) as Memory[]);
  }, []);

  const saveSettings = useCallback(async () => {
    setStatus({ kind: 'busy', message: 'Saving…' });
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.from('settings').update(settings).eq('id', 1);
      if (error) throw new Error(error.message);
      setStatus({ kind: 'ok', message: 'Saved. The website is updated.' });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not save.',
      });
    }
  }, [settings]);

  const saveSong = useCallback(async () => {
    setStatus({ kind: 'busy', message: 'Saving…' });
    try {
      const supabase = getBrowserClient();
      const [a, b] = await Promise.all([
        supabase.from('song').update(song).eq('id', 1),
        supabase
          .from('settings')
          .update({
            song_heading: settings.song_heading,
            background_audio_url: settings.background_audio_url,
          })
          .eq('id', 1),
      ]);
      if (a.error) throw new Error(a.error.message);
      if (b.error) throw new Error(b.error.message);
      setStatus({ kind: 'ok', message: 'Saved. The website is updated.' });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not save.',
      });
    }
  }, [settings.background_audio_url, settings.song_heading, song]);

  const signOut = useCallback(async () => {
    await getBrowserClient().auth.signOut();
    window.location.href = '/admin';
  }, []);

  const saveBar = useMemo(
    () => (
      <div className="sticky bottom-0 -mx-5 mt-6 border-t border-[#e6dffa] bg-[#f7f4fd]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button
          className="w-full"
          onClick={() => void (tab === 'Music' ? saveSong() : saveSettings())}
          disabled={status.kind === 'busy'}
        >
          Save Changes
        </Button>
        <StatusLine kind={status.kind} message={status.message} />
      </div>
    ),
    [saveSettings, saveSong, status, tab],
  );

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--accent)]">Admin</h1>
          <p className="font-body text-xs text-[#a49cc4]">{email}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-full bg-white px-4 font-display text-sm font-bold text-[#544c7c] ring-1 ring-inset ring-[#ded5f2] transition hover:bg-[#faf7ff] active:scale-95"
          >
            Preview Website ↗
          </a>
          <Button tone="neutral" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </header>

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-current={tab === t ? 'page' : undefined}
            className={`min-h-[44px] flex-1 basis-[30%] rounded-full px-4 font-display text-sm font-bold transition active:scale-95 sm:flex-none sm:basis-auto ${
              tab === t
                ? 'bg-[var(--accent)] text-white shadow-button'
                : 'bg-white text-[#544c7c] ring-1 ring-inset ring-[#ded5f2]'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* ------------------------------------------------------------ WEBSITE */}
      {tab === 'Website' ? (
        <>
          <Card className="space-y-4">
            <SectionTitle sub="The basics that appear across the whole site.">
              Website Settings
            </SectionTitle>

            <Field label="Friend Name">
              <TextInput
                value={settings.friend_name}
                onChange={(e) => set('friend_name', e.target.value)}
                placeholder="DEA"
              />
            </Field>

            <Field label="Birthday Date" hint="Shown on the final screen, exactly as you type it.">
              <TextInput
                value={settings.birthday_date}
                onChange={(e) => set('birthday_date', e.target.value)}
                placeholder="February 8, 2027"
              />
            </Field>

            <Field
              label="Intro Heading"
              hint="Leave empty to use “Happy Birthday {name}!” automatically."
            >
              <TextInput
                value={settings.intro_title}
                onChange={(e) => set('intro_title', e.target.value)}
                placeholder="Happy Birthday DEA!"
              />
            </Field>

            <Field label="Intro Message">
              <TextInput
                value={settings.intro_message}
                onChange={(e) => set('intro_message', e.target.value)}
                placeholder="Click the next button!! 💙"
              />
            </Field>

            <Field label="Emoticon" hint="The little face under the character.">
              <TextInput
                value={settings.intro_emoticon}
                onChange={(e) => set('intro_emoticon', e.target.value)}
                placeholder="(｡◕‿◕｡)"
              />
            </Field>

            <Field label="Next Button Label">
              <TextInput
                value={settings.intro_button_label}
                onChange={(e) => set('intro_button_label', e.target.value)}
                placeholder="Next!! ^w^"
              />
            </Field>

            <MediaUploadField
              label="Birthday Character"
              hint="A GIF works beautifully here. Square images look best."
              kind="image"
              value={settings.intro_media_url}
              onChange={(url) => set('intro_media_url', url)}
            />

            <Field label="Character description" hint="For screen readers.">
              <TextInput
                value={settings.intro_media_alt}
                onChange={(e) => set('intro_media_alt', e.target.value)}
                placeholder="A little bear holding flowers"
              />
            </Field>

            <Field label="Main Accent Color">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Main accent colour"
                  value={settings.accent_color}
                  onChange={(e) => set('accent_color', e.target.value)}
                  className="h-12 w-16 cursor-pointer rounded-xl border border-[#ded5f2] bg-white p-1"
                />
                <TextInput
                  value={settings.accent_color}
                  onChange={(e) => set('accent_color', e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </Field>

            <div className="border-t border-[#eee8fa] pt-4">
              <Field label="Memories Heading">
                <TextInput
                  value={settings.memories_heading}
                  onChange={(e) => set('memories_heading', e.target.value)}
                  placeholder="Memories 📸"
                />
              </Field>
            </div>

            <Field label="Memories Subheading (optional)">
              <TextInput
                value={settings.memories_subheading}
                onChange={(e) => set('memories_subheading', e.target.value)}
                placeholder="the ones we made, and the ones still to come"
              />
            </Field>
          </Card>
          {saveBar}
        </>
      ) : null}

      {/* ----------------------------------------------------------- MEMORIES */}
      {tab === 'Memories' ? (
        <MemoriesManager memories={memories} onRefresh={refreshMemories} />
      ) : null}

      {/* -------------------------------------------------------------- MUSIC */}
      {tab === 'Music' ? (
        <>
          <Card className="space-y-4">
            <SectionTitle sub="The song on screen 3.">A Song Just For You</SectionTitle>

            <Field label="Section Heading">
              <TextInput
                value={settings.song_heading}
                onChange={(e) => set('song_heading', e.target.value)}
                placeholder="A Song Just For You"
              />
            </Field>

            <Field label="Song Title">
              <TextInput
                value={song.title}
                onChange={(e) => setSong({ ...song, title: e.target.value })}
                placeholder="LATINA FOREVA"
              />
            </Field>

            <Field label="Artist">
              <TextInput
                value={song.artist}
                onChange={(e) => setSong({ ...song, artist: e.target.value })}
                placeholder="KAROL G"
              />
            </Field>

            <Field label="Where is the song from?">
              <Select
                value={song.source_type}
                onChange={(e) =>
                  setSong({ ...song, source_type: e.target.value as SongSourceType })
                }
              >
                <option value="none">Nothing yet</option>
                <option value="youtube">YouTube link</option>
                <option value="spotify">Spotify link</option>
                <option value="file">Audio file</option>
              </Select>
            </Field>

            {song.source_type === 'youtube' || song.source_type === 'spotify' ? (
              <Field label={song.source_type === 'youtube' ? 'YouTube URL' : 'Spotify URL'}>
                <TextInput
                  value={song.source_url}
                  onChange={(e) => setSong({ ...song, source_url: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
            ) : null}

            {song.source_type === 'file' ? (
              <MediaUploadField
                label="Song file"
                hint="An MP3 or M4A from your phone or computer."
                kind="audio"
                value={song.source_url || null}
                onChange={(url) => setSong({ ...song, source_url: url ?? '' })}
              />
            ) : null}

            <Field label="Personal Message" hint="Shown in italics under the player.">
              <TextArea
                rows={4}
                value={song.personal_message}
                onChange={(e) => setSong({ ...song, personal_message: e.target.value })}
                placeholder="This song reminds me of you…"
              />
            </Field>
          </Card>

          <div className="mt-4">
            <Card className="space-y-4">
              <SectionTitle sub="Plays quietly behind the whole experience. The speaker button in the corner turns it on and off.">
                Background Music
              </SectionTitle>
              <MediaUploadField
                label="Background Music"
                hint="Leave empty to hide the speaker button completely."
                kind="audio"
                value={settings.background_audio_url}
                onChange={(url) => set('background_audio_url', url)}
              />
            </Card>
          </div>
          {saveBar}
        </>
      ) : null}

      {/* ------------------------------------------------------------- LETTER */}
      {tab === 'Letter' ? (
        <>
          <Card className="space-y-4">
            <SectionTitle sub="Screen 4. Take your time with this one.">
              A Letter For You
            </SectionTitle>

            <Field label="Section Heading">
              <TextInput
                value={settings.letter_heading}
                onChange={(e) => set('letter_heading', e.target.value)}
                placeholder="A Letter for You 💌"
              />
            </Field>

            <MediaUploadField
              label="Letter Card Image"
              hint="The little birthday card above the letter."
              kind="image"
              value={settings.letter_card_url}
              onChange={(url) => set('letter_card_url', url)}
            />

            <Field label="Card Caption">
              <TextInput
                value={settings.letter_card_caption}
                onChange={(e) => set('letter_card_caption', e.target.value)}
                placeholder="Happy Birthday!"
              />
            </Field>

            <Field label="Card description" hint="For screen readers.">
              <TextInput
                value={settings.letter_card_alt}
                onChange={(e) => set('letter_card_alt', e.target.value)}
                placeholder="A pink birthday card"
              />
            </Field>

            <Field label="Greeting">
              <TextInput
                value={settings.letter_greeting}
                onChange={(e) => set('letter_greeting', e.target.value)}
                placeholder="Happy Birthday!"
              />
            </Field>

            <Field
              label="Letter"
              hint="Leave a blank line between paragraphs. Emojis are welcome 💙"
            >
              <TextArea
                rows={14}
                value={settings.letter_text}
                onChange={(e) => set('letter_text', e.target.value)}
                placeholder="Write the whole letter here…"
              />
            </Field>

            <Field label="Sign-off (optional)">
              <TextInput
                value={settings.letter_signature}
                onChange={(e) => set('letter_signature', e.target.value)}
                placeholder="— me 💙"
              />
            </Field>
          </Card>
          {saveBar}
        </>
      ) : null}

      {/* ------------------------------------------------------------- FINALE */}
      {tab === 'Finale' ? (
        <>
          <Card className="space-y-4">
            <SectionTitle sub="The last screen, with the confetti.">Finale</SectionTitle>

            <Field label="Birthday Date" hint="The big text in the middle.">
              <TextInput
                value={settings.birthday_date}
                onChange={(e) => set('birthday_date', e.target.value)}
                placeholder="February 8, 2027"
              />
            </Field>

            <Field label="Emojis">
              <TextInput
                value={settings.finale_emojis}
                onChange={(e) => set('finale_emojis', e.target.value)}
                placeholder="💙 🎂 💙"
              />
            </Field>

            <Field label="Extra Message (optional)">
              <TextArea
                rows={3}
                value={settings.finale_text}
                onChange={(e) => set('finale_text', e.target.value)}
                placeholder="Anything you want to say at the very end…"
              />
            </Field>

            <Field label="Celebrate Button">
              <TextInput
                value={settings.finale_celebrate_label}
                onChange={(e) => set('finale_celebrate_label', e.target.value)}
                placeholder="Celebrate 🎉"
              />
            </Field>

            <Field label="Start Over Button">
              <TextInput
                value={settings.finale_start_over_label}
                onChange={(e) => set('finale_start_over_label', e.target.value)}
                placeholder="Start Over 💙"
              />
            </Field>

            <Field label="Footer" hint="Leave empty to hide it completely.">
              <TextInput
                value={settings.footer_text}
                onChange={(e) => set('footer_text', e.target.value)}
                placeholder="Made with ❤️ for DEA"
              />
            </Field>
          </Card>
          {saveBar}
        </>
      ) : null}
    </main>
  );
}
