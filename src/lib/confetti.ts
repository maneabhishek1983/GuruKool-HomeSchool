import confetti from 'canvas-confetti';

/**
 * Trigger confetti burst effect
 */
export function celebrateSuccess(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  };

  confetti({
    ...defaults,
    ...options,
    colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'],
  });
}

/**
 * Trigger continuous confetti
 */
export function celebrateContinuous(duration: number = 3000) {
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#6366F1', '#EC4899', '#F59E0B'],
    });

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10B981', '#3B82F6', '#EC4899'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Trigger fireworks effect
 */
export function celebrateFireworks() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#6366F1', '#EC4899', '#F59E0B'],
    });

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#10B981', '#3B82F6', '#EC4899'],
    });
  }, 250);
}

/**
 * Trigger emoji burst
 */
export function celebrateWithEmoji(emoji: string = '🎉') {
  const scalar = 2;
  const emojiShape = confetti.shapeFromText({ text: emoji, scalar });

  confetti({
    particleCount: 30,
    spread: 100,
    startVelocity: 30,
    shapes: [emojiShape],
    scalar,
  });
}
