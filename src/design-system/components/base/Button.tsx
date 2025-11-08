'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn, themeClasses } from '../../themes/theme-utils';
import { interactionAnimations } from '../../animations/presets';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  motionProps?: MotionProps;
}

const buttonVariants = {
  primary:
    'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-sm hover:shadow-primary-md',
  secondary:
    'bg-secondary-500 hover:bg-secondary-600 text-white shadow-secondary-sm hover:shadow-secondary-md',
  outline:
    'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
  ghost: 'text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  danger:
    'bg-error-500 hover:bg-error-600 text-white shadow-error-sm hover:shadow-error-md',
};

const buttonSizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  motionProps,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',

        // Variant styles
        buttonVariants[variant],

        // Size styles
        buttonSizes[size],

        // Width styles
        fullWidth && 'w-full',

        // Focus styles
        variant === 'primary' && 'focus:ring-primary-500',
        variant === 'secondary' && 'focus:ring-secondary-500',
        variant === 'outline' && 'focus:ring-primary-500',
        variant === 'ghost' && 'focus:ring-primary-500',
        variant === 'danger' && 'focus:ring-error-500',

        className
      )}
      disabled={isDisabled}
      {...(!isDisabled
        ? {
            whileHover: interactionAnimations.buttonHover,
            whileTap: interactionAnimations.buttonTap,
          }
        : {})}
      {...(motionProps || {})}
      {...props}
    >
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {leftIcon && !loading && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}

      <span className={loading ? 'opacity-0' : ''}>{children}</span>

      {rightIcon && !loading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  );
}
