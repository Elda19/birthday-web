'use client';

/**
 * Confetti explosion, then a natural fall from the top of the viewport.
 * Uses canvas-confetti, loaded on demand so it isn't in the first bundle.
 */

const COLORS = [
  '#2563eb',
  '#60a5fa',
  '#f472b6',
  '#fbbf24',
  '#34d399',
  '#a78bfa',
  '#fb7185',
  '#ffffff',
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export async function launchConfetti(): Promise<void> {
  if (typeof window === 'undefined') return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const confetti = (await import('canvas-confetti')).default;

  if (reduced) {
    // A single, very small acknowledgement instead of a storm.
    confetti({
      particleCount: 24,
      spread: 60,
      startVelocity: 24,
      ticks: 90,
      origin: { x: 0.5, y: 0.45 },
      colors: COLORS,
      disableForReducedMotion: false,
    });
    return;
  }

  // 1. The bang: two cannons from the lower corners.
  const cannon = (x: number, angle: number) =>
    confetti({
      particleCount: 55,
      angle,
      spread: 68,
      startVelocity: 46,
      decay: 0.91,
      gravity: 1,
      ticks: 200,
      scalar: 1.05,
      origin: { x, y: 0.72 },
      colors: COLORS,
      shapes: ['square', 'circle'],
    });

  void cannon(0.08, 62);
  void cannon(0.92, 118);

  // 2. The rain: keeps falling for a few seconds, gentle on the CPU.
  const duration = 4200;
  const endsAt = Date.now() + duration;
  let tick = 0;

  const frame = () => {
    tick += 1;
    // Emit on every other frame -> roughly 90 particles a second.
    if (tick % 2 === 0) {
      void confetti({
        particleCount: 3,
        startVelocity: 0,
        ticks: 260,
        gravity: rand(0.5, 0.75),
        drift: rand(-0.75, 0.75),
        scalar: rand(0.7, 1.35),
        origin: { x: Math.random(), y: -0.06 },
        colors: COLORS,
        shapes: ['square', 'circle'],
      });
    }
    if (Date.now() < endsAt) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export default launchConfetti;
