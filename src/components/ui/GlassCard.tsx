'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'dark' | 'frosted';
  hover?: boolean;
  gradient?: boolean;
  blur?: 'sm' | 'md' | 'lg';
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hover = true,
  gradient = false,
  blur,
}: GlassCardProps) {
  const variants = {
    default: 'bg-white/70 backdrop-blur-md border-white/20',
    light: 'bg-white/50 backdrop-blur-sm border-white/10',
    dark: 'bg-white/30 backdrop-blur-lg border-white/30',
    frosted: 'bg-white/10 backdrop-blur-xl border-white/20',
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border shadow-xl overflow-hidden',
        variants[variant],
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
