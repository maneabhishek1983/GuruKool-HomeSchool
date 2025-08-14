'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn, themeClasses } from '../../themes/theme-utils';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: 'display' | 'heading' | 'body' | 'caption' | 'overline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'disabled' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  motionProps?: MotionProps;
}

const textVariants = {
  display: 'font-bold tracking-tight',
  heading: 'font-semibold tracking-tight',
  body: 'font-normal',
  caption: 'font-normal text-sm',
  overline: 'font-medium text-xs uppercase tracking-wide',
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

const textWeights = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const textColors = {
  primary: themeClasses.text.primary,
  secondary: themeClasses.text.secondary,
  muted: themeClasses.text.muted,
  disabled: themeClasses.text.disabled,
  success: 'text-success-600 dark:text-success-400',
  warning: 'text-warning-600 dark:text-warning-400',
  error: 'text-error-600 dark:text-error-400',
};

const textAligns = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

export function Text({
  children,
  as = 'p',
  variant = 'body',
  size = 'md',
  weight,
  color = 'primary',
  align = 'left',
  truncate = false,
  className,
  motionProps,
  ...props
}: TextProps) {
  const Component = motion[as] as any;
  
  // Determine default weight based on variant
  const defaultWeight = weight || (variant === 'display' ? 'bold' : variant === 'heading' ? 'semibold' : 'normal');

  return (
    <Component
      className={cn(
        // Base styles
        'transition-colors duration-200',
        
        // Variant styles
        textVariants[variant],
        
        // Size styles
        textSizes[size],
        
        // Weight styles
        textWeights[defaultWeight],
        
        // Color styles
        textColors[color],
        
        // Alignment styles
        textAligns[align],
        
        // Truncate styles
        truncate && 'truncate',
        
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}

// Semantic text components
export function Heading({
  level = 1,
  ...props
}: Omit<TextProps, 'as' | 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const sizeMap = {
    1: '3xl' as const,
    2: '2xl' as const,
    3: 'xl' as const,
    4: 'lg' as const,
    5: 'md' as const,
    6: 'sm' as const,
  };

  return (
    <Text
      as={`h${level}` as any}
      variant="heading"
      size={sizeMap[level]}
      {...props}
    />
  );
}

export function Display({ ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="display" size="4xl" {...props} />;
}

export function Body({ ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="body" {...props} />;
}

export function Caption({ ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" {...props} />;
}

export function Overline({ ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="overline" {...props} />;
}