'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';

// ============================================
// Confetti Effect
// ============================================

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  gravity?: number;
  drift?: number;
  ticks?: number;
  shapes?: ('square' | 'circle')[];
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  shape: 'square' | 'circle';
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<ConfettiParticle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  const fire = useCallback((options: ConfettiOptions = {}) => {
    const defaultColors = [
      '#0ea5e9', // primary
      '#d946ef', // secondary
      '#22c55e', // success
      '#f59e0b', // warning
      '#ef4444', // error
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
    ];

    const {
      particleCount = 50,
      spread = 70,
      origin = { x: 0.5, y: 0.5 },
      colors = defaultColors,
      gravity = 1,
      drift = 0,
      ticks = 200,
      shapes = ['square', 'circle'],
    } = options;

    // Create or get canvas
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Create particles
    const spreadRad = (spread * Math.PI) / 180;
    const originX = origin.x * canvas.width;
    const originY = origin.y * canvas.height;

    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad;
      const velocity = 15 + Math.random() * 10;

      particles.current.push({
        id: Date.now() + i,
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity + drift,
        vy: Math.sin(angle) * velocity,
        color:
          colors[Math.floor(Math.random() * colors.length)] ||
          colors[0] ||
          '#0ea5e9',
        shape: shapes[Math.floor(Math.random() * shapes.length)] || 'square',
        size: 6 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        opacity: 1,
      });
    }

    let ticksRemaining = ticks;

    const animate = () => {
      if (!ctx || !canvas) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += gravity * 0.3;
        particle.vx *= 0.99;
        particle.rotation += particle.rotationSpeed;
        particle.opacity -= 1 / ticks;

        if (particle.opacity <= 0) {
          return false;
        }

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        if (particle.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(
            -particle.size / 2,
            -particle.size / 2,
            particle.size,
            particle.size
          );
        }

        ctx.restore();
        return true;
      });

      ticksRemaining--;

      if (particles.current.length > 0 && ticksRemaining > 0) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Cleanup canvas
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
          canvasRef.current = null;
        }
      }
    };

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animate();
  }, []);

  const cleanup = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (canvasRef.current?.parentNode) {
      canvasRef.current.parentNode.removeChild(canvasRef.current);
      canvasRef.current = null;
    }
    particles.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { fire, cleanup };
}

// Confetti presets
export const confettiPresets = {
  celebration: {
    particleCount: 100,
    spread: 90,
    origin: { x: 0.5, y: 0.6 },
  },
  fireworks: {
    particleCount: 75,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
  },
  shower: {
    particleCount: 50,
    spread: 180,
    origin: { x: 0.5, y: 0 },
    gravity: 0.5,
  },
  burst: {
    particleCount: 30,
    spread: 45,
    gravity: 2,
  },
};

// ============================================
// Breathing Animation Hook
// ============================================

export interface BreathingOptions {
  minScale?: number;
  maxScale?: number;
  duration?: number;
  minOpacity?: number;
  maxOpacity?: number;
}

export function useBreathingAnimation(options: BreathingOptions = {}) {
  const {
    minScale = 0.95,
    maxScale = 1.05,
    duration = 3,
    minOpacity = 0.7,
    maxOpacity = 1,
  } = options;

  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    let start: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!start) {
        start = timestamp;
      }
      const elapsed = (timestamp - start) / 1000;
      const progress = (Math.sin((elapsed * Math.PI * 2) / duration) + 1) / 2;

      scale.set(minScale + progress * (maxScale - minScale));
      opacity.set(minOpacity + progress * (maxOpacity - minOpacity));

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [minScale, maxScale, duration, minOpacity, maxOpacity, scale, opacity]);

  return { scale, opacity };
}

// ============================================
// Magnetic Hover Effect
// ============================================

export interface MagneticOptions {
  strength?: number;
  radius?: number;
  ease?: number;
}

export function useMagneticHover(options: MagneticOptions = {}) {
  const { strength = 0.3, radius = 200, ease = 0.15 } = options;

  const elementRef = useRef<HTMLElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < radius) {
        const factor = (1 - distance / radius) * strength;
        x.set(distanceX * factor);
        y.set(distanceY * factor);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, radius, x, y]);

  return {
    ref: elementRef,
    style: {
      x: springX,
      y: springY,
    },
  };
}

// ============================================
// Parallax Effect
// ============================================

export interface ParallaxOptions {
  speed?: number;
  direction?: 'vertical' | 'horizontal' | 'both';
  reverse?: boolean;
  easing?: 'linear' | 'smooth';
}

export function useParallax(options: ParallaxOptions = {}) {
  const {
    speed = 0.5,
    direction = 'vertical',
    reverse = false,
    easing = 'smooth',
  } = options;

  const scrollY = useMotionValue(0);

  const factor = reverse ? -speed : speed;

  const y = useTransform(scrollY, value => {
    if (direction === 'horizontal') {
      return 0;
    }
    return value * factor;
  });

  const x = useTransform(scrollY, value => {
    if (direction === 'vertical') {
      return 0;
    }
    return value * factor;
  });

  // Always call hooks - React hooks must be called unconditionally
  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  // Return the appropriate values based on easing preference
  return easing === 'smooth' ? { x: springX, y: springY } : { x, y };
}

// ============================================
// Tilt Effect (3D rotation on hover)
// ============================================

export interface TiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  maxGlare?: number;
}

export function useTiltEffect(options: TiltOptions = {}) {
  const {
    maxTilt = 15,
    perspective = 1000,
    scale = 1.05,
    speed = 400,
    glare = false,
    maxGlare = 0.3,
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scaleValue = useMotionValue(1);
  const glareOpacity = useMotionValue(0);
  const glarePosition = useMotionValue({ x: 50, y: 50 });

  const springConfig = { stiffness: speed, damping: 30 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);
  const springScale = useSpring(scaleValue, springConfig);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      rotateX.set((0.5 - y) * maxTilt);
      rotateY.set((x - 0.5) * maxTilt);
      scaleValue.set(scale);

      if (glare) {
        glareOpacity.set(maxGlare);
        glarePosition.set({ x: x * 100, y: y * 100 });
      }
    };

    const handleMouseLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
      scaleValue.set(1);
      glareOpacity.set(0);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    maxTilt,
    scale,
    glare,
    maxGlare,
    rotateX,
    rotateY,
    scaleValue,
    glareOpacity,
    glarePosition,
  ]);

  return {
    ref: elementRef,
    style: {
      rotateX: springRotateX,
      rotateY: springRotateY,
      scale: springScale,
      transformPerspective: perspective,
    },
    glareStyle: glare
      ? {
          opacity: glareOpacity,
          background: `radial-gradient(circle at ${glarePosition.get().x}% ${glarePosition.get().y}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 80%)`,
        }
      : undefined,
  };
}

// ============================================
// Ripple Effect
// ============================================

export interface RippleOptions {
  color?: string;
  duration?: number;
  opacity?: number;
}

interface RippleState {
  x: number;
  y: number;
  id: number;
}

export function useRipple(options: RippleOptions = {}) {
  const {
    color = 'rgba(255, 255, 255, 0.35)',
    duration = 600,
    opacity = 1,
  } = options;

  const [ripples, setRipples] = useState<RippleState[]>([]);

  const addRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple = { x, y, id: Date.now() };
      setRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, duration);
    },
    [duration]
  );

  const rippleElements = ripples.map(ripple => (
    <span
      key={ripple.id}
      style={{
        position: 'absolute',
        left: ripple.x,
        top: ripple.y,
        width: 20,
        height: 20,
        marginLeft: -10,
        marginTop: -10,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: opacity,
        transform: 'scale(0)',
        animation: `ripple ${duration}ms ease-out forwards`,
        pointerEvents: 'none',
      }}
    />
  ));

  // CSS for ripple animation (should be injected into global styles)
  const rippleCSS = `
    @keyframes ripple {
      to {
        transform: scale(20);
        opacity: 0;
      }
    }
  `;

  return { addRipple, rippleElements, rippleCSS };
}

// ============================================
// Staggered Animation Hook
// ============================================

export interface StaggerOptions {
  delayPerItem?: number;
  initialDelay?: number;
}

export function useStaggerAnimation(
  itemCount: number,
  options: StaggerOptions = {}
) {
  const { delayPerItem = 0.1, initialDelay = 0 } = options;

  return {
    container: {
      initial: 'hidden',
      animate: 'visible',
      variants: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: delayPerItem,
            delayChildren: initialDelay,
          },
        },
      },
    },
    item: {
      variants: {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
          },
        },
      },
    },
  };
}

// ============================================
// Scroll-triggered Animation
// ============================================

export function useScrollTriggered(threshold: number = 0.2) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return { ref: elementRef, isVisible };
}
