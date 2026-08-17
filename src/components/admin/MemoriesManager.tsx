'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Memory } from '@/lib/types';
import { getBrowserClient } from '@/lib/supabase/client';
import { toDriveDirectUrl } from '@/lib/media';
import { humanFileSize, removeStoredFile, uploadImage, uploadVideo } from '@/lib/upload';
import {
  Button,
  Card,
  Field,
  IconButton,
  SectionTitle,
  StatusLine,
  TextInput,
  type StatusKind,
} from './ui';

type Props = { memories: Memory[]; onRefresh: () => Promise<void> };

const NEW_ROW = {
  alt_text: '',
  caption: '',
  location: '',
  memory_date: '',
  autoplay_muted: false,
};

export default function MemoriesManager({ memories, onRefresh }: Props) {
  const photoInput = useRef<HTMLInputElement | null>(null);
  const videoInput = useRef<HTMLInputElement | null>(null);
  const replaceInput = useRef<HTMLInputElement | null>(null);
  const replaceTarget = useRef<Memory | null>(null);

  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({
    kind: 'idle',
    message: '',
  });
  const [urlValue, setUrlValue] = useState('');
  const [urlKind, setUrlKind] = useState<'image' | 'video'>('image');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  /* Text fields save themselves a moment after you stop typing, so nothing is
     lost if you switch tabs or put your phone down mid-sentence. */
  const [drafts, setDrafts] = useState<Record<string, Partial<Memory>>>({});
  const timers = useRef<Record<string, number>>({});
  const pending = useRef<Record<string, Partial<Memory>>>({});

  const say = (kind: StatusKind, message: string) => setStatus({ kind, message });

  const flush = useCallback(async (id: string) => {
    const changes = pending.current[id];
    if (!changes || Object.keys(changes).length === 0) return;
    delete pending.current[id];
    const supabase = getBrowserClient();
    const { error } = await supabase.from('memories').update(changes).eq('id', id);
    if (error) {
      say('error', error.message);
      return;
    }
    say('ok', 'Saved.');
  }, []);

  /* Write anything still in flight when the section closes. */
  useEffect(
    () => () => {
      Object.values(timers.current).forEach((t) => window.clearTimeout(t));
      Object.keys(pending.current).forEach((id) => {
        void flush(id);
      });
    },
    [flush],
  );

  const editField = useCallback(
    (item: Memory, key: keyof Memory, value: string | boolean) => {
      setDrafts((prev) => ({ ...prev, [item.id]: { ...prev[item.id], [key]: value } }));
      pending.current[item.id] = { ...pending.current[item.id], [key]: value };
      if (timers.current[item.id]) window.clearTimeout(timers.current[item.id]);
      timers.current[item.id] = window.setTimeout(() => {
        void flush(item.id);
      }, 650);
    },
    [flush],
  );

  const valueOf = useCallback(
    (item: Memory, key: 'caption' | 'location' | 'memory_date' | 'alt_text') => {
      const draft = drafts[item.id]?.[key];
      return typeof draft === 'string' ? draft : item[key];
    },
    [drafts],
  );

  /* ------------------------------------------------------------------ add */
  const addRow = useCallback(
    async (row: Partial<Memory> & { media_type: 'image' | 'video'; media_url: string }) => {
      const supabase = getBrowserClient();
      const nextOrder =
        memories.reduce((max, m) => Math.max(max, m.sort_order), -1) + 1;
      const { error } = await supabase
        .from('memories')
        .insert({ ...NEW_ROW, ...row, sort_order: nextOrder });
      if (error) throw new Error(error.message);
      await onRefresh();
    },
    [memories, onRefresh],
  );

  const addFile = useCallback(
    async (file: File, type: 'image' | 'video') => {
      say('busy', `Uploading ${file.name} (${humanFileSize(file.size)})…`);
      try {
        if (type === 'image') {
          const res = await uploadImage(file);
          await addRow({
            media_type: 'image',
            media_url: res.url,
            storage_path: res.path,
            alt_text: '',
          });
        } else {
          const res = await uploadVideo(file);
          await addRow({
            media_type: 'video',
            media_url: res.url,
            storage_path: res.path,
            poster_url: res.poster?.url ?? null,
            poster_path: res.poster?.path ?? null,
          });
        }
        say('ok', 'Upload complete.');
      } catch (err) {
        say('error', `Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    },
    [addRow],
  );

  const addUrl = useCallback(async () => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    const drive = toDriveDirectUrl(trimmed);
    if (/drive\.google\.com|photos\.google\.com/i.test(trimmed) && !drive) {
      say(
        'error',
        'That Google link cannot be displayed directly. Please download the file and upload it instead.',
      );
      return;
    }
    say('busy', 'Adding…');
    try {
      await addRow({ media_type: urlKind, media_url: drive || trimmed });
      setUrlValue('');
      say('ok', 'Added.');
    } catch (err) {
      say('error', err instanceof Error ? err.message : 'Could not add that link.');
    }
  }, [addRow, urlKind, urlValue]);

  /* --------------------------------------------------------------- update */
  const patch = useCallback(
    async (id: string, changes: Partial<Memory>) => {
      const supabase = getBrowserClient();
      const { error } = await supabase.from('memories').update(changes).eq('id', id);
      if (error) {
        say('error', error.message);
        return;
      }
      await onRefresh();
    },
    [onRefresh],
  );

  const replaceMedia = useCallback(
    async (item: Memory, file: File) => {
      say('busy', `Uploading replacement (${humanFileSize(file.size)})…`);
      try {
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
          const res = await uploadVideo(file);
          await patch(item.id, {
            media_type: 'video',
            media_url: res.url,
            storage_path: res.path,
            poster_url: res.poster?.url ?? null,
            poster_path: res.poster?.path ?? null,
          });
        } else {
          const res = await uploadImage(file);
          await patch(item.id, {
            media_type: 'image',
            media_url: res.url,
            storage_path: res.path,
            poster_url: null,
            poster_path: null,
          });
        }
        await removeStoredFile(item.storage_path);
        await removeStoredFile(item.poster_path);
        say('ok', 'Replaced.');
      } catch (err) {
        say('error', `Replace failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    },
    [patch],
  );

  /* --------------------------------------------------------------- delete */
  const remove = useCallback(
    async (item: Memory) => {
      const label = item.caption || item.alt_text || `this ${item.media_type}`;
      if (!window.confirm(`Are you sure you want to delete this memory?\n\n${label}`)) return;
      say('busy', 'Deleting…');
      try {
        const supabase = getBrowserClient();
        const { error } = await supabase.from('memories').delete().eq('id', item.id);
        if (error) throw new Error(error.message);
        await removeStoredFile(item.storage_path);
        await removeStoredFile(item.poster_path);
        await onRefresh();
        say('ok', 'Memory deleted.');
      } catch (err) {
        say('error', err instanceof Error ? err.message : 'Could not delete.');
      }
    },
    [onRefresh],
  );

  /* -------------------------------------------------------------- reorder */
  const persistOrder = useCallback(
    async (ordered: Memory[]) => {
      setSavingOrder(true);
      say('busy', 'Saving order…');
      try {
        const supabase = getBrowserClient();
        await Promise.all(
          ordered.map((m, i) =>
            supabase.from('memories').update({ sort_order: i }).eq('id', m.id),
          ),
        );
        await onRefresh();
        say('ok', 'Order saved.');
      } catch (err) {
        say('error', err instanceof Error ? err.message : 'Could not save the order.');
      } finally {
        setSavingOrder(false);
      }
    },
    [onRefresh],
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= memories.length || from === to) return;
      const copy = [...memories];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      void persistOrder(copy);
    },
    [memories, persistOrder],
  );

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle sub="Photos and videos, in the order visitors will see them.">
          Manage Memories
        </SectionTitle>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => photoInput.current?.click()}>+ Add Photo</Button>
          <Button onClick={() => videoInput.current?.click()}>+ Add Video</Button>
        </div>

        <input
          ref={photoInput}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            void (async () => {
              for (const f of files) await addFile(f, 'image');
            })();
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*,.mov,.mp4,.webm"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            void (async () => {
              for (const f of files) await addFile(f, 'video');
            })();
          }}
        />
        <input
          ref={replaceInput}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            const target = replaceTarget.current;
            e.target.value = '';
            if (f && target) void replaceMedia(target, f);
          }}
        />

        <div className="mt-5 space-y-2 border-t border-[#eee8fa] pt-4">
          <Field label="Or add by link" hint="A direct image/video URL, or a YouTube video link.">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex gap-2">
                <Button
                  tone={urlKind === 'image' ? 'primary' : 'neutral'}
                  onClick={() => setUrlKind('image')}
                >
                  Photo
                </Button>
                <Button
                  tone={urlKind === 'video' ? 'primary' : 'neutral'}
                  onClick={() => setUrlKind('video')}
                >
                  Video
                </Button>
              </div>
              <TextInput
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://…"
                aria-label="Media link"
              />
              <Button onClick={() => void addUrl()} ariaLabel="Add media from link">
                Add
              </Button>
            </div>
          </Field>
        </div>

        <StatusLine kind={status.kind} message={status.message} />
      </Card>

      {memories.length === 0 ? (
        <Card>
          <p className="py-6 text-center font-body text-sm text-[#8b83ad]">
            No memories added yet. Add your first photo or video.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {memories.map((item, i) => {
            const kindLabel = item.media_type === 'video' ? 'video' : 'photo';
            return (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom !== null) move(dragFrom, i);
                setDragFrom(null);
              }}
              onDragEnd={() => setDragFrom(null)}
            >
              <Card className={dragFrom === i ? 'opacity-50' : ''}>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 cursor-grab select-none text-lg text-[#b6adcf]"
                    title="Drag to reorder"
                  >
                    ⠿
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[0.9375rem] font-bold uppercase tracking-wide text-[#6d6494]">
                      {item.media_type === 'video' ? 'Video' : 'Photo'} {i + 1}
                    </p>

                    <div className="mt-2 flex items-start gap-3">
                      {item.media_type === 'video' ? (
                        <video
                          src={item.media_url}
                          poster={item.poster_url ?? undefined}
                          controls
                          preload="metadata"
                          className="h-24 w-24 flex-shrink-0 rounded-2xl bg-black object-cover ring-1 ring-[#ded5f2]"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.media_url}
                          alt=""
                          loading="lazy"
                          className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover ring-1 ring-[#ded5f2]"
                        />
                      )}

                      <div className="flex flex-wrap gap-2">
                        <IconButton
                          ariaLabel={`Move ${kindLabel} ${i + 1} up`}
                          disabled={i === 0 || savingOrder}
                          onClick={() => move(i, i - 1)}
                        >
                          ↑
                        </IconButton>
                        <IconButton
                          ariaLabel={`Move ${kindLabel} ${i + 1} down`}
                          disabled={i === memories.length - 1 || savingOrder}
                          onClick={() => move(i, i + 1)}
                        >
                          ↓
                        </IconButton>
                        <IconButton
                          ariaLabel={`Replace ${kindLabel} ${i + 1}`}
                          onClick={() => {
                            replaceTarget.current = item;
                            replaceInput.current?.click();
                          }}
                        >
                          ⟳
                        </IconButton>
                        <IconButton
                          ariaLabel={`Delete ${kindLabel} ${i + 1}`}
                          tone="danger"
                          onClick={() => void remove(item)}
                        >
                          🗑
                        </IconButton>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      <Field label="Caption">
                        <TextInput
                          value={valueOf(item, 'caption')}
                          placeholder="Monaco 2026 😂💙"
                          onChange={(e) => editField(item, 'caption', e.target.value)}
                          onBlur={() => void flush(item.id)}
                        />
                      </Field>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Location (optional)">
                          <TextInput
                            value={valueOf(item, 'location')}
                            placeholder="Monte Carlo"
                            onChange={(e) => editField(item, 'location', e.target.value)}
                            onBlur={() => void flush(item.id)}
                          />
                        </Field>
                        <Field label="Date (optional)">
                          <TextInput
                            value={valueOf(item, 'memory_date')}
                            placeholder="Summer 2026"
                            onChange={(e) => editField(item, 'memory_date', e.target.value)}
                            onBlur={() => void flush(item.id)}
                          />
                        </Field>
                      </div>

                      {item.media_type === 'image' ? (
                        <Field
                          label="Alt text (optional)"
                          hint="Describes the photo for screen readers."
                        >
                          <TextInput
                            value={valueOf(item, 'alt_text')}
                            placeholder="The two of us on the beach"
                            onChange={(e) => editField(item, 'alt_text', e.target.value)}
                            onBlur={() => void flush(item.id)}
                          />
                        </Field>
                      ) : (
                        <label className="flex min-h-[48px] items-center gap-3 font-body text-sm font-semibold text-[#544c7c]">
                          <input
                            type="checkbox"
                            checked={item.autoplay_muted}
                            onChange={(e) =>
                              void patch(item.id, { autoplay_muted: e.target.checked })
                            }
                            className="h-5 w-5 accent-[var(--accent)]"
                          />
                          Autoplay this video muted
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
