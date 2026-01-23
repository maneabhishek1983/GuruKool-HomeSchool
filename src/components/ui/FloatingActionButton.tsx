'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  pulse?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function FloatingActionButton({
  icon,
  label,
  onClick,
  variant = 'primary',
  pulse = false,
  position = 'bottom-right',
}: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/50',
    secondary: 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/50',
    success: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/50',
  };

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <motion.div
      className={cn('fixed z-50', positions[position])}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
    >
      <motion.button
        onClick={onClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'relative flex items-center gap-3 rounded-full text-white font-semibold',
          'focus:outline-none focus:ring-4 focus:ring-indigo-500/50',
          'transition-all duration-300',
          variants[variant]
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={
          pulse
            ? {
                boxShadow: [
                  '0 10px 25px rgba(99, 102, 241, 0.5)',
                  '0 10px 40px rgba(99, 102, 241, 0.8)',
                  '0 10px 25px rgba(99, 102, 241, 0.5)',
                ],
              }
            : {}
        }
        transition={
          pulse
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        {/* Pulse ring effect */}
        {pulse && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/50"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Icon */}
        <div className={cn('flex items-center justify-center', label ? 'w-14 h-14' : 'w-16 h-16')}>
          <motion.div
            animate={isHovered ? { rotate: 15 } : { rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {icon}
          </motion.div>
        </div>

        {/* Label (expands on hover) */}
        <AnimatePresence>
          {label && isHovered && (
            <motion.span
              className="pr-5 whitespace-nowrap"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
