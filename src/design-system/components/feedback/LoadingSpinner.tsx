'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../themes/theme-utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'current';
  variant?: 'spin' | 'pulse' | 'bounce' | 'dots';
  className?: string;
}

const spinnerSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColors = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-500',
  current: 'text-current',
};

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  variant = 'spin',
  className,
}: LoadingSpinnerProps) {
  if (variant === 'spin') {
    return (
      <motion.div
        className={cn(
          'border-2 border-current border-t-transparent rounded-full',
          spinnerSizes[size],
          spinnerColors[color],
          className
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn(
          'rounded-full bg-current',
          spinnerSizes[size],
          spinnerColors[color],
          className
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  if (variant === 'bounce') {
    return (
      <motion.div
        className={cn(
          'rounded-full bg-current',
          spinnerSizes[size],
          spinnerColors[color],
          className
        )}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'rounded-full bg-current',
              size === 'xs' ? 'w-1 h-1' : 
              size === 'sm' ? 'w-1.5 h-1.5' :
              size === 'md' ? 'w-2 h-2' :
              size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
              spinnerColors[color]
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}