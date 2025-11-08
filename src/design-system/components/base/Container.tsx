'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '../../themes/theme-utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  motionProps?: MotionProps;
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-8xl',
  full: 'max-w-full',
};

export function Container({
  children,
  size = 'lg',
  centered = true,
  className,
  motionProps,
  style,
  ...props
}: ContainerProps) {
  return (
    <motion.div
      className={cn(
        // Base styles
        'w-full px-4 sm:px-6 lg:px-8',
        
        // Size styles
        containerSizes[size],
        
        // Centering
        centered && 'mx-auto',
        
        className
      )}
      {...(style && { style })}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Section container with semantic spacing
export function Section({
  children,
  spacing = 'md',
  className,
  motionProps,
  ...props
}: ContainerProps & { spacing?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  };

  return (
    <motion.section
      className={cn(
        spacingClasses[spacing],
        className
      )}
      {...motionProps}
      {...props}
    >
      <Container>{children}</Container>
    </motion.section>
  );
}