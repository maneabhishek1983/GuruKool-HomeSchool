/**
 * Deterministic face-descriptor fixtures for E2E tests.
 *
 * face-api.js descriptors are 128 floats roughly in [-1, 1]. Real descriptors
 * are L2-normalized (norm ≈ 1) and the server compares them via Euclidean
 * distance with FACE_MATCH_THRESHOLD (default 0.4).
 *
 * Strategy:
 * - Use a seeded PRNG so the same `seed` always produces the same descriptor.
 *   This gives stable fixtures across runs and CI.
 * - Provide three primitives the E2E suite needs:
 *     1) `makeDescriptor(seed)`        — a deterministic enrolled descriptor.
 *     2) `closeVariant(d, drift)`      — a small-perturbation copy that should
 *                                        match (distance < threshold).
 *     3) `farVariant(seed)`            — a different descriptor that should NOT
 *                                        match (distance > threshold).
 *
 * The math is calibrated so `closeVariant` with the default drift (0.01)
 * produces distance ≈ 0.11 (well under 0.4) and `farVariant` produces
 * distance ≈ 0.9+ (well over 0.4). See the inline assertion at module load.
 */

const DESCRIPTOR_LENGTH = 128;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function l2Normalize(v: number[]): number[] {
  let sq = 0;
  for (const x of v) {
    sq += x * x;
  }
  const norm = Math.sqrt(sq) || 1;
  return v.map(x => x / norm);
}

/**
 * Produce a deterministic, L2-normalized 128-float descriptor.
 * Same seed → same descriptor across processes and platforms.
 */
export function makeDescriptor(seed: number): number[] {
  const rand = mulberry32(seed);
  const raw = Array.from({ length: DESCRIPTOR_LENGTH }, () => rand() * 2 - 1);
  return l2Normalize(raw);
}

/**
 * Small perturbation of `base` that stays within the match threshold.
 * Default `drift` (0.01) yields distance ≈ 0.11 — comfortably under 0.4.
 *
 * Pass `drift` ≈ 0.06 to land near threshold for boundary tests.
 */
export function closeVariant(base: number[], drift = 0.01): number[] {
  if (base.length !== DESCRIPTOR_LENGTH) {
    throw new Error(`closeVariant: expected 128 floats, got ${base.length}`);
  }
  // Seed from the base so the variant is also reproducible.
  const rand = mulberry32(Math.floor(base[0]! * 1e9) ^ 0xdeadbeef);
  const out = base.map(x => x + (rand() * 2 - 1) * drift);
  return l2Normalize(out);
}

/**
 * A descriptor that should NOT match the canonical seed=1 descriptor.
 * Uses a far-away seed; distance to seed=1 is reliably > 0.9.
 */
export function farVariant(seed = 9999): number[] {
  return makeDescriptor(seed);
}

/** Convenience handles for the common fixtures. */
export const FACE_FIXTURES = {
  /** Canonical enrolled descriptor — use this for the test student. */
  enrolled: () => makeDescriptor(1),
  /** A near-identical capture — should match. */
  matchingCapture: () => closeVariant(makeDescriptor(1), 0.01),
  /** Same identity but right at the boundary — useful for threshold tests. */
  boundaryCapture: () => closeVariant(makeDescriptor(1), 0.06),
  /** A different identity — should NOT match. */
  mismatchedCapture: () => farVariant(9999),
};

/**
 * Self-test on module load (dev / CI safety net).
 * If anyone tweaks the math and breaks the calibration, fail loudly rather
 * than producing silently-wrong test verdicts.
 */
function selfCheck(): void {
  const a = FACE_FIXTURES.enrolled();
  const b = FACE_FIXTURES.matchingCapture();
  const c = FACE_FIXTURES.mismatchedCapture();
  const dist = (x: number[], y: number[]) => {
    let s = 0;
    for (let i = 0; i < DESCRIPTOR_LENGTH; i++) {
      const dx = x[i]! - y[i]!;
      s += dx * dx;
    }
    return Math.sqrt(s);
  };
  const matchDist = dist(a, b);
  const mismatchDist = dist(a, c);
  if (matchDist > 0.3) {
    throw new Error(
      `face-test-mock: matching pair distance ${matchDist.toFixed(3)} > 0.3 ` +
        `— recalibrate drift in closeVariant`
    );
  }
  if (mismatchDist < 0.7) {
    throw new Error(
      `face-test-mock: mismatched pair distance ${mismatchDist.toFixed(3)} < 0.7 ` +
        `— pick a more distant farVariant seed`
    );
  }
}
selfCheck();
