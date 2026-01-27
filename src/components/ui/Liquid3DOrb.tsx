'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export type OrbTheme =
  | 'literacy'
  | 'numeracy'
  | 'stem'
  | 'creative'
  | 'gurukool'
  | 'none';

interface Liquid3DOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'gradient' | 'glow';
  theme?: OrbTheme;
  interactive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const sizeConfig = {
  sm: { width: 64, height: 64, fontSize: '10px' },
  md: { width: 96, height: 96, fontSize: '14px' },
  lg: { width: 128, height: 128, fontSize: '18px' },
  xl: { width: 192, height: 192, fontSize: '24px' },
};

const themeParticles: Record<OrbTheme, string[]> = {
  literacy: ['A', 'B', 'C', 'a', 'b', 'c', 'Aa', 'Bb', '?', '!'],
  numeracy: ['1', '2', '3', '+', '÷', '%', '=', '×', '123'],
  stem: ['⚛️', '🧬', '📐', '💻', '⚗️', '🔭', '🦠', '⚡'],
  creative: ['🎨', '🎵', '🎭', '🖌️', '🎼', '🎻', '🎬', '✏️'],
  gurukool: ['G', 'u', 'r', 'u', 'K', 'o', 'o', 'l', '🎓', '📚'],
  none: [],
};

const variantConfig = {
  primary: {
    background:
      'linear-gradient(135deg, rgba(37, 99, 235, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%)',
    shadow: 'rgba(37, 99, 235, 0.5)',
    glow: 'rgba(99, 102, 241, 0.3)',
    particle: 'rgba(255, 255, 255, 0.5)',
  },
  secondary: {
    background:
      'linear-gradient(135deg, rgba(20, 184, 166, 0.8) 0%, rgba(6, 182, 212, 0.8) 100%)',
    shadow: 'rgba(20, 184, 166, 0.5)',
    glow: 'rgba(6, 182, 212, 0.3)',
    particle: 'rgba(255, 255, 255, 0.6)',
  },
  gradient: {
    background:
      'linear-gradient(135deg, rgba(37, 99, 235, 0.8) 0%, rgba(20, 184, 166, 0.8) 50%, rgba(245, 158, 11, 0.8) 100%)',
    shadow: 'rgba(37, 99, 235, 0.4)',
    glow: 'rgba(20, 184, 166, 0.3)',
    particle: 'rgba(255, 255, 255, 0.5)',
  },
  glow: {
    background:
      'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(236, 72, 153, 0.8) 100%)',
    shadow: 'rgba(168, 85, 247, 0.5)',
    glow: 'rgba(236, 72, 153, 0.4)',
    particle: 'rgba(255, 255, 255, 0.6)',
  },
};

export function Liquid3DOrb({
  size = 'lg',
  variant = 'gradient',
  theme = 'none',
  interactive = true,
  children,
  className,
}: Liquid3DOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      char: string;
      x: number;
      y: number;
      scale: number;
      duration: number;
      delay: number;
    }>
  >([]);

  // Mouse position tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [15, -15]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-15, 15]),
    springConfig
  );

  // Check for reduced motion preference and initialize particles
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Initialize random floating particles
    if (theme !== 'none' && themeParticles[theme]) {
      const themeChars = themeParticles[theme];
      const newParticles = Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        char: themeChars[Math.floor(Math.random() * themeChars.length)] || '',
        x: Math.random() * 60 + 20, // Keep within center 60%
        y: Math.random() * 60 + 20,
        scale: Math.random() * 0.5 + 0.8,
        duration: Math.random() * 3 + 4,
        delay: Math.random() * 2,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const { width, height, fontSize } = sizeConfig[size];
  const colors = variantConfig[variant];

  // Liquid morphing animation keyframes
  const morphAnimation = reducedMotion
    ? {}
    : {
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '30% 60% 70% 40% / 50% 60% 30% 60%',
          '60% 40% 30% 70% / 60% 30% 70% 40%',
        ],
      };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex items-center justify-center select-none',
        className
      )}
      style={{ width, height, perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer glow effect */}
      <motion.div
        className="absolute inset-0 blur-2xl opacity-60 pointer-events-none"
        style={{
          background: colors.glow,
          borderRadius: '50%',
        }}
        animate={
          reducedMotion
            ? {}
            : {
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.6, 0.4],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary morphing layer */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: width * 0.9,
          height: height * 0.9,
          background: colors.background,
          opacity: 0.4,
          filter: 'blur(8px)',
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
        }}
        animate={morphAnimation}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Main liquid orb */}
      <motion.div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: width * 0.85,
          height: height * 0.85,
          background: colors.background,
          boxShadow: `
            0 10px 40px -10px ${colors.shadow},
            inset 0 -5px 20px rgba(0, 0, 0, 0.2),
            inset 0 5px 20px rgba(255, 255, 255, 0.2)
          `,
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        animate={morphAnimation}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={
          interactive && !reducedMotion
            ? {
                scale: 1.05,
                transition: { duration: 0.3 },
              }
            : {}
        }
      >
        {/* Inner highlight */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '10%',
            left: '15%',
            width: '35%',
            height: '25%',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
            filter: 'blur(4px)',
          }}
          animate={
            reducedMotion
              ? {}
              : {
                  x: [0, 5, 0],
                  y: [0, 3, 0],
                  opacity: [0.5, 0.7, 0.5],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating Themed Particles */}
        {!reducedMotion &&
          theme !== 'none' &&
          particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute font-bold text-white/40 pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                fontSize: fontSize,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.3, 0.6, 0.3],
                scale: [particle.scale, particle.scale * 1.1, particle.scale],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: particle.delay,
              }}
            >
              {particle.char}
            </motion.div>
          ))}

        {/* Default Bubbles if no theme */}
        {!reducedMotion &&
          theme === 'none' &&
          [0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/20 pointer-events-none"
              style={{
                width: 4 + i * 2,
                height: 4 + i * 2,
                left: `${25 + i * 20}%`,
                bottom: '20%',
              }}
              animate={{
                y: [0, -20 - i * 10, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}

        {/* Children content */}
        <div className="relative z-10 flex items-center justify-center">
          {children}
        </div>
      </motion.div>

      {/* Orbiting particles (only for themed or interactive) */}
      {!reducedMotion && (interactive || theme !== 'none') && (
        <>
          {[0, 1, 2].map(i => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 rounded-full pointer-events-none"
              style={{
                background: `rgba(255, 255, 255, ${0.3 + i * 0.1})`,
                filter: 'blur(1px)',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-white/40"
                style={{
                  x: width * 0.55 + i * 8,
                }}
              />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}

export default Liquid3DOrb;
