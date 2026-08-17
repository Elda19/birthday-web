'use client';

import { motion, useReducedMotion } from 'framer-motion';
import PrimaryButton from './PrimaryButton';

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  /** Zero-based index of the current screen, for the little dots. */
  step: number;
  total: number;
  onJump?: (index: number) => void;
  className?: string;
};

export default function NavigationButtons({
  onBack,
  onNext,
  backLabel = '← Back',
  nextLabel = 'Next →',
  step,
  total,
  onJump,
  className = 'mt-8',
}: Props) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center gap-4 ${className}`}
    >
      <div className="flex w-full items-center justify-center gap-3">
        {onBack ? (
          <PrimaryButton variant="ghost" size="md" onClick={onBack} ariaLabel="Go back">
            {backLabel}
          </PrimaryButton>
        ) : null}
        {onNext ? (
          <PrimaryButton size="md" hearts onClick={onNext} ariaLabel="Go to the next part">
            {nextLabel}
          </PrimaryButton>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5" role="tablist" aria-label="Progress">
        {Array.from({ length: total }).map((_, i) => {
          const active = i === step;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Go to part ${i + 1} of ${total}`}
              onClick={() => onJump?.(i)}
              className="grid h-6 w-4 place-items-center"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  active
                    ? 'h-2 w-5 bg-[var(--accent)]'
                    : 'h-2 w-2 bg-[#c9c0e6] hover:bg-[#ada2d6]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
