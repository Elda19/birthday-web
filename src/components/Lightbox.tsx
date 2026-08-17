'use client';

import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Memory } from '@/lib/types';

type Props = {
  items: Memory[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
};

export default function Lightbox({ items, index, onClose, onChange }: Props) {
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;
      onChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, go]);

  const current = index === null ? null : items[index];
  const label = current ? current.caption || current.alt_text || 'Photo' : '';
  const meta = current ? [current.location, current.memory_date].filter(Boolean).join(' · ') : '';

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#221c38]/85 p-4 backdrop-blur-sm"
        >
          <motion.figure
            key={current.id}
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            drag={items.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) go(1);
              else if (info.offset.x > 70) go(-1);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full w-full max-w-[560px] flex-col items-center gap-3"
          >
            {current.media_type === 'video' ? (
              <video
                src={current.media_url}
                poster={current.poster_url ?? undefined}
                controls
                autoPlay
                playsInline
                className="max-h-[72vh] w-auto max-w-full rounded-3xl shadow-2xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.media_url}
                alt={current.alt_text || current.caption || ''}
                draggable={false}
                className="max-h-[72vh] w-auto max-w-full rounded-3xl object-contain shadow-2xl"
              />
            )}

            {current.caption || meta ? (
              <figcaption className="wrap-anywhere max-w-full rounded-2xl bg-white/93 px-4 py-2 text-center font-body text-sm text-[#4b4470] shadow-soft">
                {current.caption ? <span>{current.caption}</span> : null}
                {meta ? (
                  <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wide text-[#8b83ad]">
                    {meta}
                  </span>
                ) : null}
              </figcaption>
            ) : null}
          </motion.figure>

          {items.length > 1 ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-lg text-[#4b4470] shadow-soft transition hover:bg-white active:scale-95"
              >
                ‹
              </button>
              <span className="min-w-[62px] text-center font-body text-xs font-semibold tracking-wide text-white/85">
                {(index ?? 0) + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-lg text-[#4b4470] shadow-soft transition hover:bg-white active:scale-95"
              >
                ›
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/90 text-lg text-[#4b4470] shadow-soft transition hover:bg-white active:scale-95"
          >
            ✕
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
