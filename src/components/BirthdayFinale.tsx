'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Settings } from '@/lib/types';
import launchConfetti from './ConfettiEffect';
import PrimaryButton from './PrimaryButton';

type Props = { settings: Settings; onBack: () => void; onStartOver: () => void };

export default function BirthdayFinale({ settings, onBack, onStartOver }: Props) {
  const [celebrated, setCelebrated] = useState(false);
  const prefersReduced = useReducedMotion();

  const celebrate = useCallback(() => {
    setCelebrated(true);
    void launchConfetti();
  }, []);

  return (
    <section className="flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-8 py-6 text-center">
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        <motion.h2
          animate={
            celebrated && !prefersReduced ? { scale: [1, 1.14, 1], y: [0, -6, 0] } : { scale: 1 }
          }
          transition={{ duration: 1.1, ease: 'easeOut', times: [0, 0.35, 1] }}
          className="wrap-anywhere font-display text-[1.9rem] font-extrabold leading-tight text-[#2b2447] sm:text-[2.1rem]"
        >
          {settings.birthday_date || 'Happy Birthday'}
        </motion.h2>

        {settings.finale_emojis ? (
          <motion.p
            aria-hidden="true"
            animate={
              celebrated && !prefersReduced
                ? { rotate: [0, -7, 7, -4, 0], scale: [1, 1.22, 1.08, 1] }
                : {}
            }
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.1 }}
            className="text-[1.85rem] tracking-[0.22em]"
          >
            {settings.finale_emojis}
          </motion.p>
        ) : null}

        {settings.finale_text ? (
          <p className="wrap-anywhere mx-auto max-w-[30ch] whitespace-pre-line font-body text-[1rem] text-[#544c7c]">
            {settings.finale_text}
          </p>
        ) : null}
      </motion.div>

      <AnimatePresence mode="wait">
        {!celebrated ? (
          <motion.div
            key="celebrate"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <PrimaryButton hearts onClick={celebrate} ariaLabel="Celebrate with confetti">
              {settings.finale_celebrate_label || 'Celebrate 🎉'}
            </PrimaryButton>
          </motion.div>
        ) : (
          <motion.div
            key="after"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <PrimaryButton onClick={onStartOver} ariaLabel="Start the journey over">
              {settings.finale_start_over_label || 'Start Over 💙'}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => void launchConfetti()}
              className="rounded-full px-4 py-2 font-body text-sm font-semibold text-[#6d6494] transition hover:text-[var(--accent)] active:scale-95"
            >
              one more time 🎉
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 flex flex-col items-center gap-4">
        <PrimaryButton variant="ghost" size="md" onClick={onBack} ariaLabel="Go back">
          ← Back
        </PrimaryButton>

        {settings.footer_text ? (
          <p className="wrap-anywhere font-body text-[0.6875rem] tracking-wide text-[#a49cc4]">
            {settings.footer_text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
