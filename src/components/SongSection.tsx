'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { Settings, Song } from '@/lib/types';
import { toSpotifyEmbed, toYouTubeEmbed } from '@/lib/media';
import NavigationButtons from './NavigationButtons';

type Props = {
  settings: Settings;
  song: Song;
  onBack: () => void;
  onNext: () => void;
  step: number;
  total: number;
  onJump: (index: number) => void;
};

export default function SongSection({
  settings,
  song,
  onBack,
  onNext,
  step,
  total,
  onJump,
}: Props) {
  const prefersReduced = useReducedMotion();

  const youtube = song.source_type === 'youtube' ? toYouTubeEmbed(song.source_url) : '';
  const spotify = song.source_type === 'spotify' ? toSpotifyEmbed(song.source_url) : '';
  const file = song.source_type === 'file' ? song.source_url : '';
  const hasPlayer = Boolean(youtube || spotify || file);

  const rise = (delay: number) => ({
    initial: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="flex min-h-[calc(100dvh-8rem)] flex-col justify-center py-4">
      <motion.h2
        {...rise(0.04)}
        className="mb-5 text-center font-display text-[1.6rem] font-extrabold text-[var(--accent)]"
      >
        <span aria-hidden="true">🎵 </span>
        {settings.song_heading || 'A Song Just For You'}
      </motion.h2>

      <motion.div
        {...rise(0.14)}
        className="rounded-[28px] bg-white/80 p-3.5 shadow-card ring-1 ring-white/70 backdrop-blur-sm"
      >
        {youtube ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-[#0f1020]">
            <iframe
              src={youtube}
              title={`${song.title || 'Song'}${song.artist ? ` by ${song.artist}` : ''}`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        ) : null}

        {spotify ? (
          <iframe
            src={spotify}
            title={`${song.title || 'Song'}${song.artist ? ` by ${song.artist}` : ''}`}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="h-[152px] w-full rounded-[20px] border-0"
          />
        ) : null}

        {file ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls preload="metadata" src={file} className="w-full">
            Your browser cannot play this file.
          </audio>
        ) : null}

        {!hasPlayer ? (
          <p className="rounded-[20px] bg-lavender-100 px-4 py-10 text-center font-body text-sm text-[#8b83ad]">
            <span className="block text-3xl" aria-hidden="true">
              🎧
            </span>
            <span className="mt-2 block">A song is on its way</span>
          </p>
        ) : null}

        {song.title || song.artist ? (
          <div className="px-1.5 pb-1 pt-4">
            {song.title ? (
              <p className="wrap-anywhere font-display text-[1.1rem] font-bold uppercase tracking-wide text-[#332c53]">
                {song.title}
              </p>
            ) : null}
            {song.artist ? (
              <p className="wrap-anywhere mt-0.5 font-body text-sm font-semibold uppercase tracking-[0.08em] text-[#8b83ad]">
                {song.artist}
              </p>
            ) : null}
          </div>
        ) : null}
      </motion.div>

      {song.personal_message ? (
        <motion.blockquote
          {...rise(0.26)}
          className="wrap-anywhere mx-auto mt-6 max-w-[34ch] text-center font-body text-[1.0625rem] italic leading-relaxed text-[#544c7c]"
        >
          <span aria-hidden="true" className="mr-0.5 text-[var(--accent)]">
            “
          </span>
          {song.personal_message}
          <span aria-hidden="true" className="ml-0.5 text-[var(--accent)]">
            ”
          </span>
        </motion.blockquote>
      ) : null}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        step={step}
        total={total}
        onJump={onJump}
      />
    </section>
  );
}
