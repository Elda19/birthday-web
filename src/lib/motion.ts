import type { Variants } from 'framer-motion';

export const screenVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 34 : -34,
    scale: 0.975,
  }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -26 : 26,
    scale: 0.985,
  }),
};

export const reducedScreenVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};
