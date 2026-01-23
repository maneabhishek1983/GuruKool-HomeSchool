'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  gradient?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  blur,
  hover = true,
  gradient = false,
}: GlassCardProps) {
  const variants = {
    default: 'bg-white/70 border-white/20',
    light: 'bg-white/50 border-white/10',
    dark: 'bg-white/30 border-white/30',
  };

  const blurVariants = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  // Determine blur class: use explicit blur prop if provided, otherwise use variant defaults
  const getBlurClass = () => {
    if (blur) {
      return blurVariants[blur];
    }
    switch (variant) {
      case 'light':
        return 'backdrop-blur-sm';
      case 'dark':
        return 'backdrop-blur-lg';
      default:
        return 'backdrop-blur-md';
    }
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border shadow-xl overflow-hidden',
        variants[variant],
        getBlurClass(),
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }
          : {}
      }
    >
      {/* Gradient border glow */}
      {gradient && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Subtle shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 pointer-events-none"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
