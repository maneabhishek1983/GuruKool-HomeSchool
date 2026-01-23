'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedGradientBackgroundProps {
  theme: 'parent' | 'teacher' | 'student' | 'admin';
}

const themeColors = {
  parent: {
    primary: '#6366f1', // Indigo
    secondary: '#8b5cf6', // Purple
    accent: '#ec4899', // Pink
    name: 'parent',
  },
  teacher: {
    primary: '#10b981', // Emerald
    secondary: '#14b8a6', // Teal
    accent: '#06b6d4', // Cyan
    name: 'teacher',
  },
  student: {
    primary: '#f59e0b', // Amber
    secondary: '#f97316', // Orange
    accent: '#ef4444', // Red
    name: 'student',
  },
  admin: {
    primary: '#3b82f6', // Blue
    secondary: '#6366f1', // Indigo
    accent: '#8b5cf6', // Purple
    name: 'admin',
  },
};

export default function AnimatedGradientBackground({
  theme,
}: AnimatedGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = themeColors[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Store canvas dimensions for blob class access (avoids null checks)
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Animated blobs
    class Blob {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;

      constructor(color: string) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.radius = Math.random() * 200 + 100;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.color = color;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.radius) {
          this.x = canvasWidth + this.radius;
        }
        if (this.x > canvasWidth + this.radius) {
          this.x = -this.radius;
        }
        if (this.y < -this.radius) {
          this.y = canvasHeight + this.radius;
        }
        if (this.y > canvasHeight + this.radius) {
          this.y = -this.radius;
        }
      }

      draw() {
        if (!ctx) {
          return;
        }
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        );
        gradient.addColorStop(0, this.color + '40');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const blobs = [
      new Blob(colors.primary),
      new Blob(colors.secondary),
      new Blob(colors.accent),
      new Blob(colors.primary),
      new Blob(colors.secondary),
    ];

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      blobs.forEach(blob => {
        blob.update();
        blob.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [colors]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ filter: 'blur(80px)' }}
      />
      <motion.div
        className="fixed inset-0 bg-gradient-to-br opacity-50"
        style={{
          backgroundImage: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 50%, ${colors.accent}20 100%)`,
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </>
  );
}
