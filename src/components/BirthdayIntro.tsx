'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Settings } from '@/lib/types';
import { pickRandom } from '@/lib/media';
import PrimaryButton from './PrimaryButton';

const SURPRISES = [
  'you are so loved today 💙',
  'okay but the cake is mine 🎂',
  'one more year of you being iconic ✨',
  'pssst… keep going, it gets better 👀',
  'best person alive fr 💫',
];

export default function BirthdayIntro({
  settings,
  onNext,
}: {
  settings: Settings;
  onNext: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [surprise, setSurprise] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const tapCharacter = useCallback(() => {
    setSurprise((prev) => pickRandom(SURPRISES, prev ?? undefined));
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSurprise(null), 2600);
  }, []);

  const fade = (delay: number) => ({
    initial: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  });

  const title =
    settings.intro_title.trim() ||
    (settings.friend_name ? `Happy Birthday ${settings.friend_name}!` : 'Happy Birthday!');

  return (
    <section className="flex min-h-[calc(100dvh-13rem)] flex-col items-center justify-center gap-6 py-2 text-center">
      <motion.h1
        {...fade(0.05)}
        className="wrap-anywhere font-display text-[2.05rem] font-extrabold leading-[1.15] text-[var(--accent)] drop-shadow-[0_2px_0_rgba(255,255,255,0.75)] sm:text-[2.35rem]"
      >
        {title}
        <span className="mt-1 block text-3xl" aria-hidden="true">
          💙
        </span>
      </motion.h1>

      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.28, type: 'spring', stiffness: 220, damping: 17 }}
        className="relative"
      >
        <button
          type="button"
          onClick={tapCharacter}
          aria-label={
            settings.intro_media_url
              ? `${settings.intro_media_alt || 'Birthday character'}. Tap for a surprise.`
              : 'Tap for a surprise'
          }
          className="group relative block rounded-full"
        >
          <span
            aria-hidden="true"
            className="absolute -inset-3 rounded-full bg-gradient-to-br from-white/70 to-white/10 blur-[6px]"
          />
          <span className="relative block overflow-hidden rounded-full bg-[#fbd9e2] p-1.5 shadow-card ring-4 ring-white/85">
            <span className={prefersReduced ? 'block' : 'float-slow block'}>
              {settings.intro_media_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={settings.intro_media_url}
                  alt={settings.intro_media_alt || 'Birthday character'}
                  className="h-[clamp(190px,58vw,258px)] w-[clamp(190px,58vw,258px)] rounded-full object-cover transition-transform duration-300 group-active:scale-95"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-[clamp(190px,58vw,258px)] w-[clamp(190px,58vw,258px)] place-items-center rounded-full text-[4.5rem]"
                >
                  🎂
                </span>
              )}
            </span>
          </span>
        </button>

        <AnimatePresence>
          {surprise ? (
            <motion.p
              key={surprise}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="absolute -bottom-4 left-1/2 z-10 w-max max-w-[min(78vw,320px)] -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 font-body text-[0.8125rem] font-semibold text-[#4b4470] shadow-card"
            >
              {surprise}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <motion.div {...fade(0.5)} className="space-y-1.5">
        {settings.intro_emoticon ? (
          <p className="font-body text-lg text-[#6d6494]" aria-hidden="true">
            {settings.intro_emoticon}
          </p>
        ) : null}
        {settings.intro_message ? (
          <p className="wrap-anywhere font-body text-[1.0625rem] font-semibold text-[#544c7c]">
            {settings.intro_message}
          </p>
        ) : null}
      </motion.div>

      <motion.div {...fade(0.68)}>
        <PrimaryButton hearts onClick={onNext} ariaLabel="Start the birthday journey">
          {settings.intro_button_label || 'Next'} <span aria-hidden="true">→</span>
        </PrimaryButton>
      </motion.div>
    </section>
  );
}
