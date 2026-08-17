'use client';

import { useRef, useState } from 'react';
import type { Memory } from '@/lib/types';

/**
 * One photo or video in the public gallery. Photos open the lightbox, videos
 * play in place. A video only loads its data once you press play, so a gallery
 * with 50 items still opens quickly.
 */
export default function MediaCard({
  item,
  eager,
  onOpen,
}: {
  item: Memory;
  eager: boolean;
  onOpen: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (item.media_type === 'video') {
    return (
      <div className="relative overflow-hidden rounded-[20px] bg-[#1a1730]">
        <video
          ref={videoRef}
          src={item.media_url}
          poster={item.poster_url ?? undefined}
          controls={playing}
          playsInline
          muted={item.autoplay_muted}
          autoPlay={item.autoplay_muted}
          loop={item.autoplay_muted}
          preload={item.autoplay_muted ? 'auto' : 'metadata'}
          aria-label={item.alt_text || item.caption || 'A video memory'}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="block h-auto max-h-[72vh] w-full object-contain"
        />
        {!playing && !item.autoplay_muted ? (
          <button
            type="button"
            onClick={() => {
              void videoRef.current?.play();
            }}
            aria-label={`Play video${item.caption ? `: ${item.caption}` : ''}`}
            className="absolute inset-0 grid place-items-center bg-black/15 transition hover:bg-black/25"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/92 text-2xl shadow-card transition active:scale-95">
              <span aria-hidden="true">▶</span>
            </span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${item.alt_text || item.caption || 'A photo memory'}. Open full screen.`}
      className="block w-full"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.media_url}
        alt={item.alt_text || item.caption || ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className="block h-auto w-full rounded-[20px] bg-lavender-100 object-cover"
      />
    </button>
  );
}
