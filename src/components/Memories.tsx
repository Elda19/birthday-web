'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Memory, Settings } from '@/lib/types';
import Lightbox from './Lightbox';
import MediaCard from './MediaCard';
import NavigationButtons from './NavigationButtons';

const tiltFor = (i: number) => [-1.1, 0, 0.9, 0, -0.7, 0.6][i % 6];

type Props = {
  settings: Settings;
  memories: Memory[];
  onBack: () => void;
  onNext: () => void;
  step: number;
  total: number;
  onJump: (index: number) => void;
};

export default function Memories({
  settings,
  memories,
  onBack,
  onNext,
  step,
  total,
  onJump,
}: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const longPress = useRef<number | null>(null);
  const didLongPress = useRef(false);
  const prefersReduced = useReducedMotion();

  const photos = memories;

  const startPress = useCallback((id: string, hasCaption: boolean) => {
    didLongPress.current = false;
    if (!hasCaption) return;
    longPress.current = window.setTimeout(() => {
      didLongPress.current = true;
      setRevealed(id);
      window.setTimeout(() => setRevealed((cur) => (cur === id ? null : cur)), 2400);
    }, 420);
  }, []);

  const endPress = useCallback(() => {
    if (longPress.current) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
    }
  }, []);

  const open = useCallback((i: number) => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    setLightbox(i);
  }, []);

  return (
    <section className="py-2">
      <motion.header
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 text-center"
      >
        <h2 className="font-display text-[1.75rem] font-extrabold text-[var(--accent)]">
          {settings.memories_heading || 'Memories 📸'}
        </h2>
        {settings.memories_subheading ? (
          <p className="mx-auto mt-1.5 max-w-[30ch] font-body text-[0.9375rem] text-[#6d6494]">
            {settings.memories_subheading}
          </p>
        ) : null}
      </motion.header>

      {photos.length === 0 ? (
        <div className="rounded-[26px] border-2 border-dashed border-[#d6cdf0] bg-white/55 px-6 py-14 text-center">
          <p className="text-4xl" aria-hidden="true">
            🎀
          </p>
          <p className="mt-3 font-display text-[1.05rem] font-bold text-[#544c7c]">
            Memories coming soon
          </p>
          <p className="mt-1 font-body text-sm text-[#8b83ad]">
            This page is being filled with photos and videos 💙
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {photos.map((item, i) => (
            <motion.li
              key={item.id}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15, margin: '0px 0px -60px 0px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ rotate: prefersReduced ? 0 : tiltFor(i) }}
              className="relative"
            >
              <div
                onPointerDown={() => startPress(item.id, Boolean(item.caption))}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                onPointerCancel={endPress}
                onContextMenu={(e) => e.preventDefault()}
                className="overflow-hidden rounded-[26px] bg-white p-1.5 shadow-photo ring-1 ring-white/70 transition-transform duration-300 md:hover:-translate-y-1"
              >
                <MediaCard item={item} eager={i < 2} onOpen={() => open(i)} />
              </div>

              {item.caption || item.location || item.memory_date ? (
                <div className="mt-2 px-2 text-center">
                  {item.caption ? (
                    <p className="wrap-anywhere font-body text-[0.875rem] font-semibold text-[#544c7c]">
                      {item.caption}
                    </p>
                  ) : null}
                  {item.location || item.memory_date ? (
                    <p className="wrap-anywhere mt-0.5 font-body text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-[#a49cc4]">
                      {[item.location, item.memory_date].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <AnimatePresence>
                {revealed === item.id && item.caption ? (
                  <motion.p
                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="pointer-events-none absolute bottom-14 left-1/2 z-10 w-max max-w-[86%] -translate-x-1/2 rounded-full bg-white/96 px-4 py-2 text-center font-body text-[0.8125rem] font-semibold text-[#4b4470] shadow-card"
                  >
                    {item.caption}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </motion.li>
          ))}
        </ul>
      )}

      {photos.length > 0 ? (
        <p className="mt-5 text-center font-body text-xs text-[#8b83ad]">
          tap a photo to open it · hold it for a secret 🤫
        </p>
      ) : null}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        step={step}
        total={total}
        onJump={onJump}
      />

      <Lightbox
        items={photos}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onChange={setLightbox}
      />
    </section>
  );
}
