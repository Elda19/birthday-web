'use client';

import { getBrowserClient } from './supabase/client';
import { MEDIA_BUCKET } from './supabase/config';

export type UploadResult = { url: string; path: string };

const MAX_IMAGE_EDGE = 1800;
const IMAGE_QUALITY = 0.84;
/** Images bigger than this get compressed. Smaller ones are uploaded as-is. */
const COMPRESS_ABOVE_BYTES = 300 * 1024;

function extensionFor(file: File, fallback: string) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  return (fromName || fallback).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function randomName(ext: string) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}.${ext}`;
}

/**
 * Shrinks big phone photos in the browser before uploading.
 * If the browser cannot decode the file (HEIC on Android/Windows, for example)
 * the original is uploaded untouched rather than failing.
 */
async function compressImage(file: File): Promise<Blob> {
  if (file.size <= COMPRESS_ABOVE_BYTES) return file;
  if (file.type === 'image/gif') return file; // keep animation intact

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY),
    );
    if (!blob) return file;
    // Only keep the compressed version if it actually helped.
    return blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Grabs a frame from a video so gallery videos have a still preview. */
export async function makeVideoPoster(file: File): Promise<Blob | null> {
  try {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const frame = await new Promise<Blob | null>((resolve) => {
      const cleanup = () => URL.revokeObjectURL(url);
      const fail = () => {
        cleanup();
        resolve(null);
      };
      video.onerror = fail;
      const timeout = window.setTimeout(fail, 8000);

      video.onloadeddata = () => {
        video.currentTime = Math.min(0.4, (video.duration || 1) * 0.1);
      };
      video.onseeked = () => {
        window.clearTimeout(timeout);
        try {
          const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return fail();
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => {
            cleanup();
            resolve(b);
          }, 'image/jpeg', 0.78);
        } catch {
          fail();
        }
      };
    });

    return frame;
  } catch {
    return null;
  }
}

async function put(folder: string, name: string, body: Blob, contentType?: string) {
  const supabase = getBrowserClient();
  const path = `${folder}/${name}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
    cacheControl: '31536000',
    upsert: false,
    contentType: contentType ?? (body as File).type ?? undefined,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const body = await compressImage(file);
  const ext = body === file ? extensionFor(file, 'jpg') : 'jpg';
  return put('images', randomName(ext), body, body.type || 'image/jpeg');
}

export async function uploadVideo(
  file: File,
): Promise<UploadResult & { poster?: UploadResult }> {
  const main = await put('videos', randomName(extensionFor(file, 'mp4')), file, file.type);
  const posterBlob = await makeVideoPoster(file);
  if (!posterBlob) return main;
  try {
    const poster = await put('posters', randomName('jpg'), posterBlob, 'image/jpeg');
    return { ...main, poster };
  } catch {
    return main;
  }
}

export async function uploadAudio(file: File): Promise<UploadResult> {
  return put('audio', randomName(extensionFor(file, 'mp3')), file, file.type);
}

export async function removeStoredFile(path: string | null | undefined) {
  if (!path) return;
  try {
    await getBrowserClient().storage.from(MEDIA_BUCKET).remove([path]);
  } catch {
    /* The database row matters more than an orphaned file. */
  }
}

export function humanFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
