'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn, themeClasses } from '../../themes/theme-utils';
import { cardVariants } from '../../animations/variants';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  motionProps?: MotionProps;
}

const cardVariants_styles = {
  default: cn(
    themeClasses.bg.surface,
    themeClasses.border.default,
    themeClasses.shadow.sm,
    'border'
  ),
  elevated: cn(
    themeClasses.bg.surface,
    themeClasses.shadow.lg
  ),
  outlined: cn(
    themeClasses.bg.surface,
    themeClasses.border.default,
    'border-2'
  ),
  filled: cn(
    'bg-slate-50 dark:bg-slate-800/50'
  ),
};

const cardPadding = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  className,
  motionProps,
  style,
  ...props
}: CardProps) {
  const MotionComponent = interactive ? motion.div : motion.div;

  return (
    <MotionComponent
      className={cn(
        // Base styles
        'rounded-xl overflow-hidden',
        'transition-all duration-200 ease-in-out',
        
        // Variant styles
        cardVariants_styles[variant],
        
        // Padding styles
        cardPadding[padding],
        
        // Interactive styles
        interactive && 'cursor-pointer',
        
        className
      )}
      initial="initial"
      animate="animate"
      {...(interactive && {
        whileHover: "hover",
        whileTap: "tap",
        variants: cardVariants,
      })}
      {...(style && { style })}
      {...motionProps}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

// Card sub-components
export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'pb-4 mb-4',
        themeClasses.border.default,
        'border-b',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold',
        themeClasses.text.primary,
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm',
        themeClasses.text.secondary,
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('space-y-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2',
        'pt-4 mt-4',
        themeClasses.border.default,
        'border-t',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}