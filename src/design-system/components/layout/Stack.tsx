'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '../../themes/theme-utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  motionProps?: MotionProps;
}

const stackSpacing = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};

const alignItems = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyContent = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export function Stack({
  children,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  motionProps,
  ...props
}: StackProps) {
  return (
    <motion.div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        stackSpacing[spacing],
        alignItems[align],
        justifyContent[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...(motionProps || {})}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

// Convenience components
export function VStack(props: Omit<StackProps, 'direction'>) {
  return <Stack direction="vertical" {...props} />;
}

export function HStack(props: Omit<StackProps, 'direction'>) {
  return <Stack direction="horizontal" {...props} />;
}
