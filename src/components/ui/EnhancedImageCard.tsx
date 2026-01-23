'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface EnhancedImageCardProps {
  src: string;
  alt: string;
  title: string;
  description?: string;
  gradient?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
}

export function EnhancedImageCard({
  src,
  alt,
  title,
  description,
  gradient = 'from-teal-500 to-cyan-500',
  icon,
  size = 'medium',
  className,
  onClick,
}: EnhancedImageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Mouse position for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth tilt
  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-10, 10]),
    springConfig
  );

  // Size configurations
  const sizeConfig = {
    small: { minHeight: 'min-h-[200px]', padding: 'p-4' },
    medium: { minHeight: 'min-h-[280px]', padding: 'p-6' },
    large: { minHeight: 'min-h-[400px]', padding: 'p-8' },
  };

  // Generate floating particles on hover
  useEffect(() => {
    if (isHovered && particles.length === 0) {
      const newParticles: Particle[] = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
      setParticles(newParticles);
    } else if (!isHovered) {
      setParticles([]);
    }
  }, [isHovered, particles.length]);

  // Animate particles
  useEffect(() => {
    if (!isHovered || particles.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: (p.x + p.vx + 100) % 100,
          y: (p.y + p.vy + 100) % 100,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isHovered, particles.length]);

  // Handle mouse move for 3D tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative rounded-2xl overflow-hidden cursor-pointer group',
        'transform-gpu perspective-1000',
        sizeConfig[size].minHeight,
        className
      )}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </motion.div>
      </div>

      {/* Gradient Overlay */}
      <motion.div
        className={cn(
          'absolute inset-0 bg-gradient-to-t opacity-60',
          `${gradient.includes('from-') ? gradient : `from-${gradient}`}`,
          'via-black/40 to-transparent'
        )}
        animate={{ opacity: isHovered ? 0.8 : 0.6 }}
        transition={{ duration: 0.3 }}
      />

      {/* Glassmorphism Layer */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

      {/* Liquid Border Animation */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: isHovered ? ['200% 0', '-200% 0'] : '200% 0',
        }}
        transition={{
          duration: 1.5,
          repeat: isHovered ? Infinity : 0,
          ease: 'linear',
        }}
      />

      {/* Floating Particles */}
      {isHovered &&
        particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-teal-400 pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.3 }}
          />
        ))}

      {/* Particle Connections */}
      {isHovered && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {particles.map((p1, i) =>
            particles.slice(i + 1).map(p2 => {
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 30) {
                return (
                  <line
                    key={`${p1.id}-${p2.id}`}
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke="rgba(20, 184, 166, 0.3)"
                    strokeWidth="1"
                  />
                );
              }
              return null;
            })
          )}
        </svg>
      )}

      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut',
          repeat: isHovered ? Infinity : 0,
          repeatDelay: 1,
        }}
      />

      {/* Content Container */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end',
          sizeConfig[size].padding
        )}
      >
        {/* Icon */}
        {icon && (
          <motion.div
            className="text-4xl mb-3"
            animate={{
              rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Title with Slide Animation */}
        <motion.h3
          className="text-2xl font-bold text-white mb-2"
          animate={{ y: isHovered ? -5 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h3>

        {/* Description with Slide Animation */}
        {description && (
          <motion.p
            className="text-gray-200 text-sm"
            initial={{ opacity: 0.8, y: 0 }}
            animate={{
              opacity: isHovered ? 1 : 0.8,
              y: isHovered ? -5 : 0,
            }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            {description}
          </motion.p>
        )}

        {/* Explore Indicator */}
        <motion.div
          className="flex items-center gap-2 mt-4 text-white/80"
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : -10,
          }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <span className="text-sm font-medium">Explore</span>
          <motion.span
            animate={{ x: isHovered ? [0, 5, 0] : 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.div>
      </div>

      {/* Border Glow on Hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: '0 0 0 2px rgba(20, 184, 166, 0)',
        }}
        animate={{
          boxShadow: isHovered
            ? '0 0 20px 2px rgba(20, 184, 166, 0.4)'
            : '0 0 0 2px rgba(20, 184, 166, 0)',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export default EnhancedImageCard;
