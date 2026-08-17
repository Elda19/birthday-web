'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Heart = { id: number; x: number; emoji: string };
const HEART_EMOJIS = ['💙', '💗', '✨', '💙', '🩵'];

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  size?: 'lg' | 'md';
  hearts?: boolean;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
};

export default function PrimaryButton({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  hearts = false,
  className = '',
  ariaLabel,
  disabled = false,
  type = 'button',
}: Props) {
  const [burst, setBurst] = useState<Heart[]>([]);
  const nextId = useRef(0);
  const prefersReduced = useReducedMotion();

  const handleClick = useCallback(() => {
    if (hearts && !prefersReduced) {
      const made: Heart[] = Array.from({ length: 5 }, (_, i) => ({
        id: nextId.current++,
        x: -34 + i * 17 + (Math.random() * 10 - 5),
        emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      }));
      setBurst((prev) => [...prev, ...made]);
      window.setTimeout(() => setBurst((prev) => prev.slice(made.length)), 1100);
    }
    onClick?.();
  }, [hearts, onClick, prefersReduced]);

  const base =
    'relative inline-flex select-none items-center justify-center gap-2 rounded-full font-display font-bold tracking-wide transition-colors duration-200 will-change-transform disabled:opacity-55';
  const sizing =
    size === 'lg'
      ? 'min-h-[54px] px-8 text-[1.0625rem]'
      : 'min-h-[46px] px-6 text-[0.9375rem]';
  const look =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-white shadow-button hover:brightness-105 active:shadow-none'
      : 'bg-white/85 text-[#5b5480] shadow-soft ring-1 ring-inset ring-white/70 hover:bg-white';

  return (
    <motion.button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={handleClick}
      whileTap={prefersReduced || disabled ? undefined : { scale: 0.94 }}
      whileHover={prefersReduced || disabled ? undefined : { scale: 1.035 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className={`${base} ${sizing} ${look} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <AnimatePresence>
        {burst.map((hb) => (
          <motion.span
            key={hb.id}
            aria-hidden="true"
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -74, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ left: `calc(50% + ${hb.x}px)` }}
            className="pointer-events-none absolute top-0 z-20 text-lg"
          >
            {hb.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
