'use client';

import { useCallback, useRef, useState } from 'react';
import { toDriveDirectUrl } from '@/lib/media';
import { humanFileSize, uploadAudio, uploadImage } from '@/lib/upload';
import { Button, Field, StatusLine, TextInput, type StatusKind } from './ui';

type Kind = 'image' | 'audio';

/**
 * Reusable "one file" picker used for the intro character, the letter card and
 * the background music. Supports uploading from the device or pasting a URL.
 */
export default function MediaUploadField({
  label,
  hint,
  kind,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  kind: Kind;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({
    kind: 'idle',
    message: '',
  });

  const handleFile = useCallback(
    async (file: File) => {
      setStatus({ kind: 'busy', message: `Uploading… (${humanFileSize(file.size)})` });
      try {
        const res = kind === 'image' ? await uploadImage(file) : await uploadAudio(file);
        onChange(res.url);
        setStatus({ kind: 'ok', message: 'Upload complete. Remember to press Save.' });
      } catch (err) {
        setStatus({
          kind: 'error',
          message: `Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        });
      }
    },
    [kind, onChange],
  );

  const applyUrl = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const drive = toDriveDirectUrl(trimmed);
    if (/drive\.google\.com|photos\.google\.com/i.test(trimmed) && !drive) {
      setStatus({
        kind: 'error',
        message:
          'That Google link cannot be shown directly. Download the file and upload it instead.',
      });
      return;
    }
    onChange(drive || trimmed);
    setUrl('');
    setStatus({ kind: 'ok', message: 'Link added. Remember to press Save.' });
  }, [onChange, url]);

  return (
    <div className="space-y-3">
      <Field label={label} hint={hint}>
        <div className="flex flex-wrap items-center gap-3">
          {value ? (
            kind === 'image' ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={value}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-1 ring-[#ded5f2]"
              />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio src={value} controls className="max-w-full" />
            )
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-[#ded5f2] text-2xl text-[#b6adcf]">
              {kind === 'image' ? '🖼️' : '🎵'}
            </span>
          )}

          <div className="flex flex-wrap gap-2">
            <Button tone="neutral" onClick={() => fileRef.current?.click()}>
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value ? (
              <Button tone="neutral" onClick={() => onChange(null)}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </Field>

      <input
        ref={fileRef}
        type="file"
        accept={kind === 'image' ? 'image/*' : 'audio/*'}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />

      <div className="flex gap-2">
        <TextInput
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="…or paste a direct link"
          aria-label={`${label} link`}
        />
        <Button tone="neutral" onClick={applyUrl}>
          Add
        </Button>
      </div>

      <StatusLine kind={status.kind} message={status.message} />
    </div>
  );
}
