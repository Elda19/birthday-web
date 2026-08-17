'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const TARGET_VOLUME = 0.32;
const FADE_MS = 700;

type Props = { src: string };

/**
 * Small circular speaker button, always visible in the top-right corner.
 * Honours browser autoplay rules: if autoplay is blocked, the music starts on
 * the visitor's first tap/scroll/keypress instead. Fades in and out.
 */
export default function AudioControl({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const [wanted, setWanted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const prefersReduced = useReducedMotion();

  const cancelFade = useCallback(() => {
    if (fadeRef.current !== null) {
      window.clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (to: number, done?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;
      cancelFade();
      const from = audio.volume;
      const steps = Math.max(1, Math.round(FADE_MS / 40));
      let i = 0;
      fadeRef.current = window.setInterval(() => {
        i += 1;
        const v = from + ((to - from) * i) / steps;
        audio.volume = Math.min(1, Math.max(0, v));
        if (i >= steps) {
          cancelFade();
          done?.();
        }
      }, 40);
    },
    [cancelFade],
  );

  const start = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.volume = 0;
      await audio.play();
      setPlaying(true);
      fadeTo(TARGET_VOLUME);
      return true;
    } catch {
      setPlaying(false);
      return false;
    }
  }, [fadeTo]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeTo(0, () => {
      audio.pause();
      setPlaying(false);
    });
  }, [fadeTo]);

  /* Try to autoplay; if the browser says no, wait for the first interaction. */
  useEffect(() => {
    if (!src || unavailable) return;
    let cleanedUp = false;
    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'touchstart',
      'keydown',
      'wheel',
    ];

    const onFirstInteraction = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      events.forEach((e) => window.removeEventListener(e, onFirstInteraction));
      // Only start if the visitor hasn't muted it in the meantime.
      setWanted((w) => {
        if (w) void start();
        return w;
      });
    };

    void start().then((ok) => {
      if (ok) {
        cleanedUp = true;
        return;
      }
      events.forEach((e) =>
        window.addEventListener(e, onFirstInteraction, { once: true, passive: true }),
      );
    });

    return () => {
      cleanedUp = true;
      events.forEach((e) => window.removeEventListener(e, onFirstInteraction));
      cancelFade();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, unavailable]);

  /**
   * A tap is a real user gesture, so it can always start playback - even when
   * autoplay was blocked a moment ago. Only an audible track gets turned off.
   */
  const toggle = useCallback(() => {
    if (playing) {
      setWanted(false);
      stop();
      return;
    }
    setWanted(true);
    void start();
  }, [playing, start, stop]);

  if (!src || unavailable) return null;

  const on = playing;
  const blocked = wanted && !playing;

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="auto"
        onError={() => setUnavailable(true)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <motion.button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? 'Turn the music off' : 'Turn the music on'}
        title={on ? 'Music on' : 'Music off'}
        whileTap={prefersReduced ? undefined : { scale: 0.9 }}
        whileHover={prefersReduced ? undefined : { scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="pointer-events-auto relative grid h-11 w-11 place-items-center rounded-full bg-white/90 text-lg shadow-card ring-1 ring-white/80 backdrop-blur-sm"
      >
        <span aria-hidden="true">{on ? '🔊' : '🔇'}</span>
        {blocked ? (
          <span
            aria-hidden="true"
            className="pulse-soft absolute inset-0 rounded-full ring-2 ring-[var(--accent)]/35"
          />
        ) : null}
      </motion.button>
    </>
  );
}
