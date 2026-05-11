/**
 * Passive face-liveness via Eye Aspect Ratio (EAR) blink detection.
 *
 * Closes the printed-photo / phone-screen-replay attack class. A static face
 * never blinks; a real face blinks every 2-10s. Requiring at least one blink
 * within a short sampling window is a cheap, well-known PAD Level 1 defense.
 *
 * Reference: Soukupová & Čech, "Real-Time Eye Blink Detection using Facial
 * Landmarks" (2016).
 *
 * EAR is computed from the 6 landmark points around each eye:
 *
 *     EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 *
 * For face-api.js's 68-point model:
 *   left eye  = positions[36..41]
 *   right eye = positions[42..47]
 *
 * The blink detector uses a small state machine with hysteresis to avoid
 * counting jitter as a blink:
 *   OPEN  -- EAR < CLOSED_THRESHOLD --> CLOSING
 *   CLOSING (>= MIN_CLOSED frames)    --> BLINKED (one-shot signal)
 *   any state, after MAX_CLOSED frames --> reset (eyes-closed, not blink)
 *
 * This module is pure / synchronous / framework-free so it's trivially testable.
 */

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface LivenessConfig {
  /** EAR below this value = eyes considered closed. Default 0.21. */
  closedThreshold: number;
  /** EAR above this value = eyes considered open. Default 0.25. */
  openThreshold: number;
  /** Minimum consecutive closed-frame count to qualify as a blink. Default 1. */
  minClosedFrames: number;
  /** Maximum closed-frame count before we discard the candidate blink. Default 10. */
  maxClosedFrames: number;
}

export const DEFAULT_LIVENESS_CONFIG: LivenessConfig = {
  closedThreshold: 0.21,
  openThreshold: 0.25,
  minClosedFrames: 1,
  maxClosedFrames: 10,
};

/** Indexes of the 6 left-eye landmarks in face-api's 68-point model. */
export const LEFT_EYE_IDX = [36, 37, 38, 39, 40, 41] as const;
/** Indexes of the 6 right-eye landmarks in face-api's 68-point model. */
export const RIGHT_EYE_IDX = [42, 43, 44, 45, 46, 47] as const;

function euclidean(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute Eye Aspect Ratio for one eye given its 6 landmark points in order.
 * Returns 0 if the horizontal distance collapses (degenerate input).
 */
export function eyeAspectRatio(
  p: readonly [Point2D, Point2D, Point2D, Point2D, Point2D, Point2D]
): number {
  const [p1, p2, p3, p4, p5, p6] = p;
  const vertical = euclidean(p2, p6) + euclidean(p3, p5);
  const horizontal = euclidean(p1, p4);
  if (horizontal === 0) {
    return 0;
  }
  return vertical / (2 * horizontal);
}

/** Mean EAR across both eyes from a 68-point landmark array. */
export function dualEyeEAR(landmarks: readonly Point2D[]): number | null {
  if (!landmarks || landmarks.length < 48) {
    return null;
  }
  const pickL = LEFT_EYE_IDX.map(i => landmarks[i]) as Point2D[];
  const pickR = RIGHT_EYE_IDX.map(i => landmarks[i]) as Point2D[];
  if (pickL.some(p => !p) || pickR.some(p => !p)) {
    return null;
  }
  const earL = eyeAspectRatio(
    pickL as unknown as readonly [
      Point2D,
      Point2D,
      Point2D,
      Point2D,
      Point2D,
      Point2D,
    ]
  );
  const earR = eyeAspectRatio(
    pickR as unknown as readonly [
      Point2D,
      Point2D,
      Point2D,
      Point2D,
      Point2D,
      Point2D,
    ]
  );
  return (earL + earR) / 2;
}

type EyeState = 'OPEN' | 'CLOSING' | 'OPENING';

/**
 * Streaming blink detector. Feed it frames; it emits `blinkedThisFrame: true`
 * exactly once at the moment a complete blink (open → closed → open) is
 * confirmed. Static frames (no blink) never trigger.
 */
export class BlinkDetector {
  private state: EyeState = 'OPEN';
  private closedFrames = 0;
  private totalBlinks = 0;
  readonly config: LivenessConfig;

  constructor(config: Partial<LivenessConfig> = {}) {
    this.config = { ...DEFAULT_LIVENESS_CONFIG, ...config };
  }

  /**
   * Process the EAR for a single frame. Returns true on the frame that
   * confirms a blink (transition from CLOSING back to OPEN with enough
   * closed frames). Returns false otherwise.
   *
   * Pass `null` for frames where landmarks weren't available — those are
   * treated as "skip", not "eyes-open", to avoid false-positives when the
   * face leaves the frame.
   */
  push(ear: number | null): boolean {
    if (ear === null) {
      // Lost face → reset transient state but keep total count.
      this.state = 'OPEN';
      this.closedFrames = 0;
      return false;
    }

    const { closedThreshold, openThreshold, minClosedFrames, maxClosedFrames } =
      this.config;

    if (this.state === 'OPEN') {
      if (ear < closedThreshold) {
        this.state = 'CLOSING';
        this.closedFrames = 1;
      }
      return false;
    }

    if (this.state === 'CLOSING') {
      if (ear < closedThreshold) {
        this.closedFrames += 1;
        if (this.closedFrames > maxClosedFrames) {
          // Eyes closed too long — drowsy or non-blink; reset.
          this.state = 'OPEN';
          this.closedFrames = 0;
        }
        return false;
      }
      if (ear > openThreshold) {
        // Re-opened. Confirm blink if it was closed long enough.
        const wasValid = this.closedFrames >= minClosedFrames;
        this.state = 'OPEN';
        this.closedFrames = 0;
        if (wasValid) {
          this.totalBlinks += 1;
          return true;
        }
        return false;
      }
      // hysteresis zone: stay in CLOSING, don't reset, don't fire
      return false;
    }

    // OPENING state currently unused; reserved for future symmetric logic.
    return false;
  }

  get blinks(): number {
    return this.totalBlinks;
  }

  /** Reset detector to initial state (e.g., on retry). */
  reset(): void {
    this.state = 'OPEN';
    this.closedFrames = 0;
    this.totalBlinks = 0;
  }
}

/**
 * Convenience helper: feed an array of landmark frames; return true if at
 * least one blink was detected. Useful in tests and one-shot batch analysis.
 */
export function detectBlinkInSequence(
  frames: ReadonlyArray<readonly Point2D[] | null>,
  config?: Partial<LivenessConfig>
): boolean {
  const detector = new BlinkDetector(config);
  for (const frame of frames) {
    const ear = frame ? dualEyeEAR(frame) : null;
    if (detector.push(ear)) {
      return true;
    }
  }
  return false;
}
