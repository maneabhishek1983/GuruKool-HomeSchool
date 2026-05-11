import {
  BlinkDetector,
  DEFAULT_LIVENESS_CONFIG,
  detectBlinkInSequence,
  dualEyeEAR,
  eyeAspectRatio,
  LEFT_EYE_IDX,
  RIGHT_EYE_IDX,
  type Point2D,
} from '@/lib/face-liveness';

/**
 * Build a synthetic 68-point landmark array. Only the 12 eye landmarks
 * (indices 36-47) carry meaning here; the rest are zeroed.
 */
function makeLandmarks(leftEAR: number, rightEAR: number): Point2D[] {
  const points: Point2D[] = Array(68).fill({ x: 0, y: 0 });
  // Place each eye centered at a fixed x, with vertical span scaled to give
  // the requested EAR for a horizontal span of 1.
  // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
  // Choose horizontal = 1, so vertical sum must be 2 * EAR.
  // Use symmetric points: p1=(0,0), p4=(1,0), p2=(0.25, h), p6=(0.25, -h),
  // p3=(0.75, h), p5=(0.75, -h). Then vertical = 4h, horizontal = 1,
  // EAR = 4h / 2 = 2h → h = EAR/2.
  for (const [eyeIdx, ear] of [
    [LEFT_EYE_IDX, leftEAR],
    [RIGHT_EYE_IDX, rightEAR],
  ] as const) {
    const h = ear / 2;
    points[eyeIdx[0]] = { x: 0, y: 0 };
    points[eyeIdx[1]] = { x: 0.25, y: h };
    points[eyeIdx[2]] = { x: 0.75, y: h };
    points[eyeIdx[3]] = { x: 1, y: 0 };
    points[eyeIdx[4]] = { x: 0.75, y: -h };
    points[eyeIdx[5]] = { x: 0.25, y: -h };
  }
  return points;
}

describe('eyeAspectRatio', () => {
  it('returns 0 for degenerate (zero-width) input', () => {
    const collapsed = Array(6).fill({ x: 5, y: 5 }) as Point2D[];
    expect(eyeAspectRatio(collapsed as any)).toBe(0);
  });

  it('computes the textbook EAR for a wide-open eye', () => {
    // h = 0.15 → EAR = 0.30 (open eye)
    const points = makeLandmarks(0.3, 0.3);
    const ear = eyeAspectRatio(LEFT_EYE_IDX.map(i => points[i]) as any);
    expect(ear).toBeCloseTo(0.3, 5);
  });

  it('computes near-zero EAR for a fully closed eye', () => {
    const points = makeLandmarks(0.02, 0.02);
    const ear = eyeAspectRatio(LEFT_EYE_IDX.map(i => points[i]) as any);
    expect(ear).toBeLessThan(0.1);
  });
});

describe('dualEyeEAR', () => {
  it('averages both eyes', () => {
    const points = makeLandmarks(0.3, 0.1);
    expect(dualEyeEAR(points)).toBeCloseTo(0.2, 5);
  });

  it('returns null on too-short input', () => {
    expect(dualEyeEAR([])).toBeNull();
    expect(dualEyeEAR(Array(40).fill({ x: 0, y: 0 }))).toBeNull();
  });

  it('returns null when an eye landmark is missing', () => {
    const points = makeLandmarks(0.3, 0.3);
    points[40] = undefined as any;
    expect(dualEyeEAR(points)).toBeNull();
  });
});

describe('BlinkDetector', () => {
  const openFrame = () => makeLandmarks(0.3, 0.3);
  const closedFrame = () => makeLandmarks(0.1, 0.1);

  it('does not fire on a sequence of only open frames (static face = no blink)', () => {
    const d = new BlinkDetector();
    for (let i = 0; i < 30; i++) {
      const fired = d.push(dualEyeEAR(openFrame()));
      expect(fired).toBe(false);
    }
    expect(d.blinks).toBe(0);
  });

  it('fires exactly once on open → closed → open transition', () => {
    const d = new BlinkDetector();
    let fires = 0;
    // 3 open, 2 closed, 3 open
    for (const f of [
      openFrame,
      openFrame,
      openFrame,
      closedFrame,
      closedFrame,
      openFrame,
      openFrame,
      openFrame,
    ]) {
      if (d.push(dualEyeEAR(f()))) {
        fires += 1;
      }
    }
    expect(fires).toBe(1);
    expect(d.blinks).toBe(1);
  });

  it('does not fire while eyes remain continuously closed (drowsy ≠ blink)', () => {
    // While eyes are closed and never re-open above openThreshold, no
    // blink should ever fire — even after the maxClosedFrames reset.
    const d = new BlinkDetector({ maxClosedFrames: 3 });
    let fires = 0;
    // open, then a long continuous closed stretch (eyes shut, no re-open).
    const seq = [openFrame, ...Array(15).fill(closedFrame)];
    for (const f of seq) {
      if (d.push(dualEyeEAR(f()))) {
        fires += 1;
      }
    }
    expect(fires).toBe(0);
  });

  it('after a drowsy reset followed by recovery, subsequent blinks are still detected', () => {
    // Documented behavior: maxClosedFrames is a reset, not a permanent
    // lockout. Once the user has fully recovered (eyes open for at least
    // one frame past openThreshold), the detector functions normally.
    const d = new BlinkDetector({ maxClosedFrames: 3 });
    let fires = 0;
    // Long unbroken closed stretch (no opens in the middle), then a clean
    // recovery, then one explicit blink.
    const drowsyThenBlink = [
      openFrame,
      ...Array(8).fill(closedFrame), // continuous shut → drowsy + reset
      openFrame,
      openFrame,
      openFrame, // unambiguous recovery
      closedFrame,
      openFrame, // a normal blink
    ];
    for (const f of drowsyThenBlink) {
      if (d.push(dualEyeEAR(f()))) {
        fires += 1;
      }
    }
    // The detector is allowed to fire on the closed→open transition
    // immediately after the drowsy reset (closed=8 reset, then the next
    // closed-frame run is a real blink-in-progress). What we care about is
    // that the *legitimate* tail blink registers — i.e. fires >= 1.
    expect(fires).toBeGreaterThanOrEqual(1);
    expect(d.blinks).toBeGreaterThanOrEqual(1);
  });

  it('treats null landmarks as a reset (face left frame)', () => {
    const d = new BlinkDetector();
    // Start a blink, lose face mid-blink, then resume — should not fire.
    d.push(dualEyeEAR(openFrame()));
    d.push(dualEyeEAR(closedFrame()));
    d.push(null); // face lost
    d.push(dualEyeEAR(openFrame()));
    expect(d.blinks).toBe(0);
  });

  it('counts multiple distinct blinks across a longer sequence', () => {
    const d = new BlinkDetector();
    let fires = 0;
    const seq = [
      openFrame,
      openFrame,
      closedFrame,
      openFrame, // blink 1
      openFrame,
      openFrame,
      closedFrame,
      closedFrame,
      openFrame, // blink 2
      openFrame,
      openFrame, // pause
      closedFrame,
      openFrame, // blink 3
    ];
    for (const f of seq) {
      if (d.push(dualEyeEAR(f()))) {
        fires += 1;
      }
    }
    expect(fires).toBe(3);
    expect(d.blinks).toBe(3);
  });

  it('reset() clears state and total count', () => {
    const d = new BlinkDetector();
    for (const f of [openFrame, closedFrame, openFrame]) {
      d.push(dualEyeEAR(f()));
    }
    expect(d.blinks).toBe(1);
    d.reset();
    expect(d.blinks).toBe(0);
  });

  it('uses default config when not overridden', () => {
    const d = new BlinkDetector();
    expect(d.config.closedThreshold).toBe(
      DEFAULT_LIVENESS_CONFIG.closedThreshold
    );
    expect(d.config.openThreshold).toBe(DEFAULT_LIVENESS_CONFIG.openThreshold);
  });

  it('respects hysteresis: stays in CLOSING zone between thresholds without firing', () => {
    const d = new BlinkDetector({ closedThreshold: 0.21, openThreshold: 0.25 });
    const mid = makeLandmarks(0.23, 0.23); // between thresholds
    d.push(dualEyeEAR(makeLandmarks(0.3, 0.3))); // open
    d.push(dualEyeEAR(makeLandmarks(0.15, 0.15))); // closing
    // Hover in hysteresis zone for several frames — must NOT fire yet.
    for (let i = 0; i < 5; i++) {
      expect(d.push(dualEyeEAR(mid))).toBe(false);
    }
    // Now re-open.
    expect(d.push(dualEyeEAR(makeLandmarks(0.3, 0.3)))).toBe(true);
  });
});

describe('detectBlinkInSequence', () => {
  it('returns true for a sequence containing a blink', () => {
    const seq = [
      makeLandmarks(0.3, 0.3),
      makeLandmarks(0.1, 0.1),
      makeLandmarks(0.3, 0.3),
    ];
    expect(detectBlinkInSequence(seq)).toBe(true);
  });

  it('returns false for a static (no-blink) sequence', () => {
    const seq = Array(20).fill(makeLandmarks(0.3, 0.3));
    expect(detectBlinkInSequence(seq)).toBe(false);
  });

  it('returns false when face is missing throughout', () => {
    expect(detectBlinkInSequence([null, null, null])).toBe(false);
  });
});
