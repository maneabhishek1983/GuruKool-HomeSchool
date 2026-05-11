'use client';

import React from 'react';
import { motion, MotionStyle } from 'framer-motion';

interface LiquidGlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function LiquidGlassButton({
  children,
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  isLoading = false,
  variant = 'primary',
  style,
  ...props
}: LiquidGlassButtonProps) {
  const gradientClass =
    variant === 'danger'
      ? 'from-red-500 via-rose-500 to-pink-600 shadow-red-500/25'
      : 'from-rose-500 via-purple-500 to-indigo-500 shadow-purple-500/25';

  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      style={style as MotionStyle}
      className={`
        relative overflow-hidden rounded-2xl font-semibold text-white
        bg-gradient-to-r ${gradientClass}
        shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        ${className}
      `}
      whileHover={
        disabled
          ? {}
          : { scale: 1.02, boxShadow: '0 20px 40px rgba(168,85,247,0.35)' }
      }
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <span className="relative z-10 px-8 py-4 block">{children}</span>
    </motion.button>
  );
}
