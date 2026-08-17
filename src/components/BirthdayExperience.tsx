'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Content } from '@/lib/types';
import { reducedScreenVariants, screenVariants } from '@/lib/motion';
import AudioControl from './AudioControl';
import BirthdayFinale from './BirthdayFinale';
import BirthdayIntro from './BirthdayIntro';
import BirthdayLetter from './BirthdayLetter';
import Memories from './Memories';
import NavigationButtons from './NavigationButtons';
import SongSection from './SongSection';

const SCREENS = ['intro', 'memories', 'song', 'letter', 'finale'] as const;
const TOTAL = SCREENS.length;
const LABELS = ['Welcome', 'Memories', 'A song for you', 'A letter for you', 'Celebration'];

export default function BirthdayExperience({
  content,
  showEditButton = false,
}: {
  content: Content;
  showEditButton?: boolean;
}) {
  const { settings, song, memories } = content;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const scrollMemory = useRef<Record<number, number>>({});
  const pendingScroll = useRef<number | null>(0);
  const prefersReduced = useReducedMotion();

  /* The accent colour is chosen in Admin Mode and themes the whole site. */
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accent_color || '#2563eb');
  }, [settings.accent_color]);

  const goTo = useCallback(
    (next: number) => {
      const target = Math.min(TOTAL - 1, Math.max(0, next));
      if (target === step) return;
      scrollMemory.current[step] = window.scrollY;
      setDirection(target > step ? 1 : -1);
      pendingScroll.current = target > step ? 0 : (scrollMemory.current[target] ?? 0);
      setStep(target);
    },
    [step],
  );

  const next = useCallback(() => goTo(step + 1), [goTo, step]);
  const back = useCallback(() => goTo(step - 1), [goTo, step]);

  const startOver = useCallback(() => {
    scrollMemory.current = {};
    setDirection(-1);
    pendingScroll.current = 0;
    setStep(0);
  }, []);

  useEffect(() => {
    const y = pendingScroll.current;
    if (y === null) return;
    pendingScroll.current = null;
    const id = window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
    return () => window.cancelAnimationFrame(id);
  }, [step]);

  const screen = SCREENS[step];
  const variants = prefersReduced ? reducedScreenVariants : screenVariants;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto flex w-full max-w-[480px] justify-end px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <AudioControl src={settings.background_audio_url ?? ''} />
      </div>

      {/* Only ever rendered for a signed-in admin. */}
      {showEditButton ? (
        <a
          href="/admin"
          aria-label="Open Admin Mode"
          title="Edit this website"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-white/90 text-lg shadow-card ring-1 ring-white/80 backdrop-blur-sm transition hover:bg-white active:scale-95"
        >
          <span aria-hidden="true">✏️</span>
        </a>
      ) : null}

      <main className="relative mx-auto w-full max-w-[480px] px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))]">
        <p className="sr-only" role="status" aria-live="polite">
          {LABELS[step]}
        </p>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={screen}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              prefersReduced ? { duration: 0.18 } : { duration: 0.44, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {screen === 'intro' ? (
              <>
                <BirthdayIntro settings={settings} onNext={next} />
                <NavigationButtons step={0} total={TOTAL} onJump={goTo} className="mt-5" />
              </>
            ) : null}

            {screen === 'memories' ? (
              <Memories
                settings={settings}
                memories={memories}
                onBack={back}
                onNext={next}
                step={1}
                total={TOTAL}
                onJump={goTo}
              />
            ) : null}

            {screen === 'song' ? (
              <SongSection
                settings={settings}
                song={song}
                onBack={back}
                onNext={next}
                step={2}
                total={TOTAL}
                onJump={goTo}
              />
            ) : null}

            {screen === 'letter' ? (
              <BirthdayLetter
                settings={settings}
                onBack={back}
                onNext={next}
                step={3}
                total={TOTAL}
                onJump={goTo}
              />
            ) : null}

            {screen === 'finale' ? (
              <BirthdayFinale settings={settings} onBack={back} onStartOver={startOver} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
