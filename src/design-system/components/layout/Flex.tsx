'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '../../themes/theme-utils';

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  motionProps?: MotionProps;
}

const flexDirections = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  col: 'flex-col',
  'col-reverse': 'flex-col-reverse',
};

const flexWraps = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

const alignItems = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyContent = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const flexGaps = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};

export function Flex({
  children,
  direction = 'row',
  wrap = 'nowrap',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  className,
  motionProps,
  ...props
}: FlexProps) {
  return (
    <motion.div
      className={cn(
        'flex',
        flexDirections[direction],
        flexWraps[wrap],
        alignItems[align],
        justifyContent[justify],
        flexGaps[gap],
        className
      )}
      {...(motionProps || {})}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

interface FlexItemProps extends React.HTMLAttributes<HTMLDivElement> {
  flex?: 'none' | 'auto' | 'initial' | '1' | number;
  grow?: boolean | number;
  shrink?: boolean | number;
  basis?: 'auto' | 'full' | 'px' | string;
  order?: number;
  motionProps?: MotionProps;
}

export function FlexItem({
  children,
  flex,
  grow,
  shrink,
  basis,
  order,
  className,
  motionProps,
  ...props
}: FlexItemProps) {
  const flexClasses = [];

  if (flex === 'none') {
    flexClasses.push('flex-none');
  } else if (flex === 'auto') {
    flexClasses.push('flex-auto');
  } else if (flex === 'initial') {
    flexClasses.push('flex-initial');
  } else if (flex === '1') {
    flexClasses.push('flex-1');
  } else if (typeof flex === 'number') {
    flexClasses.push(`flex-[${flex}]`);
  }

  if (grow === true) {
    flexClasses.push('flex-grow');
  } else if (typeof grow === 'number') {
    flexClasses.push(`flex-grow-[${grow}]`);
  }

  if (shrink === true) {
    flexClasses.push('flex-shrink');
  } else if (typeof shrink === 'number') {
    flexClasses.push(`flex-shrink-[${shrink}]`);
  }

  if (basis === 'auto') {
    flexClasses.push('basis-auto');
  } else if (basis === 'full') {
    flexClasses.push('basis-full');
  } else if (basis === 'px') {
    flexClasses.push('basis-px');
  } else if (basis) {
    flexClasses.push(`basis-[${basis}]`);
  }

  if (order) {
    flexClasses.push(`order-${order}`);
  }

  return (
    <motion.div
      className={cn(...flexClasses, className)}
      {...(motionProps || {})}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
