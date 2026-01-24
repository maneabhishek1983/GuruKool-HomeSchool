'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WarmGradientBackgroundProps {
  variant?: 'dawn' | 'sunset' | 'aurora' | 'ocean';
}

const colorSchemes = {
  dawn: {
    base: '#fef7f0', // Warm cream
    colors: ['#fda4af', '#fb7185', '#f472b6', '#e879f9', '#c084fc'],
    overlay: 'linear-gradient(135deg, #fef7f0 0%, #fce7f3 50%, #f5d0fe 100%)',
  },
  sunset: {
    base: '#fff7ed',
    colors: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#dc2626'],
    overlay: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
  },
  aurora: {
    base: '#f0fdf4',
    colors: ['#86efac', '#4ade80', '#22c55e', '#14b8a6', '#06b6d4'],
    overlay: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)',
  },
  ocean: {
    base: '#f0f9ff',
    colors: ['#7dd3fc', '#38bdf8', '#0ea5e9', '#6366f1', '#8b5cf6'],
    overlay: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ddd6fe 100%)',
  },
};

export default function WarmGradientBackground({
  variant = 'dawn',
}: WarmGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scheme = colorSchemes[variant];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Organic blob class with smooth movement
    class OrganicBlob {
      x: number;
      y: number;
      baseRadius: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      phase: number;
      phaseSpeed: number;

      constructor(color: string, index: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.baseRadius = 150 + Math.random() * 200;
        this.radius = this.baseRadius;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.color = color;
        this.phase = index * Math.PI * 0.5;
        this.phaseSpeed = 0.005 + Math.random() * 0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += this.phaseSpeed;

        // Pulsate radius
        this.radius = this.baseRadius + Math.sin(this.phase) * 30;

        // Wrap around screen
        if (this.x < -this.radius) this.x = canvasWidth + this.radius;
        if (this.x > canvasWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvasHeight + this.radius;
        if (this.y > canvasHeight + this.radius) this.y = -this.radius;
      }

      draw() {
        if (!ctx) return;
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        );
        gradient.addColorStop(0, this.color + '60'); // More visible
        gradient.addColorStop(0.5, this.color + '30');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const blobs = scheme.colors.map(
      (color, i) => new OrganicBlob(color, i)
    );

    const animate = () => {
      // Fill with warm base color instead of black
      ctx.fillStyle = scheme.base;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      blobs.forEach((blob) => {
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
  }, [scheme]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ filter: 'blur(100px)' }}
      />
      {/* Warm overlay gradient */}
      <motion.div
        className="fixed inset-0 opacity-70"
        style={{ backgroundImage: scheme.overlay }}
        animate={{
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Subtle noise texture for depth */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}
