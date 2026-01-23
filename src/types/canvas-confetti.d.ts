declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: ('square' | 'circle' | Shape)[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
    resize?: boolean;
    useWorker?: boolean;
  }

  interface Shape {
    type: 'bitmap' | 'star' | 'circle' | 'square';
    bitmap?: ImageBitmap;
  }

  interface ConfettiFn {
    (options?: ConfettiOptions): Promise<null>;
    reset: () => void;
    shapeFromText: (options: { text: string; scalar?: number }) => Shape;
    shapeFromPath: (options: { path: string }) => Shape;
    create: (
      canvas?: HTMLCanvasElement | null,
      options?: { resize?: boolean; useWorker?: boolean }
    ) => ConfettiFn;
  }

  const confetti: ConfettiFn;
  export default confetti;
}
