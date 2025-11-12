'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'icon-only' | 'text-only';
  className?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  variant = 'default',
  className = '',
}: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-xl' },
    md: { icon: 'w-12 h-12', text: 'text-2xl' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl' },
    xl: { icon: 'w-20 h-20', text: 'text-4xl' },
  };

  const currentSize = sizeClasses[size];

  const LogoIcon = () => (
    <motion.svg
      className={currentSize.icon}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Background Circle */}
      <circle
        cx="60"
        cy="60"
        r="58"
        fill="url(#logoGradient)"
        className="drop-shadow-lg"
      />

      {/* Book Icon - Main Symbol */}
      <motion.path
        d="M35 25 L35 85 L50 90 L50 30 L35 25 Z"
        fill="white"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.path
        d="M50 30 L85 25 L85 85 L50 90 L50 30 Z"
        fill="white"
        fillOpacity="0.9"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      />

      {/* Book Pages Lines */}
      <motion.line
        x1="50"
        y1="45"
        x2="80"
        y2="42"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      <motion.line
        x1="50"
        y1="55"
        x2="80"
        y2="52"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      />
      <motion.line
        x1="50"
        y1="65"
        x2="80"
        y2="62"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />

      {/* Sparkle/Star - Learning Symbol */}
      <motion.circle
        cx="70"
        cy="35"
        r="3"
        fill="#FFD700"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, delay: 0.9 }}
      />
      <motion.circle
        cx="75"
        cy="30"
        r="2"
        fill="#FFD700"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, delay: 1 }}
      />
      <motion.circle
        cx="65"
        cy="30"
        r="2"
        fill="#FFD700"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, delay: 1.1 }}
      />

      {/* Gradient Definition */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
    </motion.svg>
  );

  const LogoText = () => (
    <motion.span
      className={`font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent ${currentSize.text}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      GuruKool
    </motion.span>
  );

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <LogoText />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoIcon />
      {showText && <LogoText />}
    </div>
  );
}

export default Logo;
