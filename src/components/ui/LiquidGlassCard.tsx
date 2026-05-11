'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function LiquidGlassCard({
  children,
  className = '',
  delay = 0,
}: LiquidGlassCardProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay }}
    >
      {/* Outer glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-300/30 via-purple-300/30 to-indigo-300/30 rounded-3xl blur-xl opacity-70" />

      {/* Glass card */}
      <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Subtle rainbow border reflection */}
        <div
          className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(251,113,133,0.3) 0%, rgba(192,132,252,0.3) 50%, rgba(96,165,250,0.3) 100%)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}
