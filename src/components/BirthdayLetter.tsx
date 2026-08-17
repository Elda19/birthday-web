'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { Settings } from '@/lib/types';
import NavigationButtons from './NavigationButtons';

type Props = {
  settings: Settings;
  onBack: () => void;
  onNext: () => void;
  step: number;
  total: number;
  onJump: (index: number) => void;
};

export default function BirthdayLetter({
  settings,
  onBack,
  onNext,
  step,
  total,
  onJump,
}: Props) {
  const prefersReduced = useReducedMotion();

  const paragraphs = settings.letter_text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="py-2">
      <motion.h2
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 text-center font-display text-[1.6rem] font-extrabold text-[var(--accent)]"
      >
        {settings.letter_heading || 'A Letter for You 💌'}
      </motion.h2>

      {settings.letter_card_url ? (
        <motion.figure
          initial={
            prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24, rotate: -4, scale: 0.92 }
          }
          animate={{ opacity: 1, y: 0, rotate: -1.4, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 170, damping: 18 }}
          className="mx-auto w-[min(78%,290px)] rounded-[14px] bg-cream p-3 pb-4 shadow-card ring-1 ring-white/70"
        >
          {settings.letter_card_caption ? (
            <figcaption className="pb-2.5 text-center font-display text-[1.05rem] font-bold text-[#3a3155]">
              {settings.letter_card_caption}
            </figcaption>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.letter_card_url}
            alt={settings.letter_card_alt || 'Birthday card'}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full rounded-[6px] bg-blush"
          />
        </motion.figure>
      ) : null}

      {paragraphs.length > 0 || settings.letter_greeting ? (
        <motion.article
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 rounded-[26px] bg-cream px-6 py-7 shadow-card ring-1 ring-[#f0e4bd]/70"
        >
          {settings.letter_greeting ? (
            <p className="mb-4 text-center font-display text-[1.2rem] font-bold text-[#3a3155]">
              {settings.letter_greeting}
            </p>
          ) : null}

          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="wrap-anywhere whitespace-pre-line text-center font-body text-[1.0625rem] leading-[1.75] text-[#4a4160]"
              >
                {p}
              </p>
            ))}
          </div>

          {settings.letter_signature ? (
            <p className="mt-6 text-right font-hand text-[1.6rem] leading-none text-[#5b5187]">
              {settings.letter_signature}
            </p>
          ) : null}
        </motion.article>
      ) : (
        <div className="mt-7 rounded-[26px] border-2 border-dashed border-[#e8dcb5] bg-cream/70 px-6 py-12 text-center">
          <p className="text-3xl" aria-hidden="true">
            💌
          </p>
          <p className="mt-2 font-body text-sm text-[#8b7f5f]">A letter is being written…</p>
        </div>
      )}

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
