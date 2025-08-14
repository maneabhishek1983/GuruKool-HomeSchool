'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../themes/theme-utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animated = true,
  className,
  ...props
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-neutral-200 dark:bg-neutral-700',
    animated && 'animate-pulse',
    className
  );

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-lg';
      case 'rectangular':
      default:
        return 'rounded';
    }
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              baseClasses,
              getVariantClasses(),
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={index === lines - 1 ? { ...style, width: '75%' } : style}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(baseClasses, getVariantClasses())}
      style={style}
      initial={{ opacity: 0.6 }}
      animate={animated ? { opacity: [0.6, 1, 0.6] } : {}}
      transition={animated ? {
        duration: 1.5,
        repeat: Infinity,
      } : {}}
      {...props}
    />
  );
}

// Preset skeleton components
export function SkeletonText({ lines = 3, ...props }: Omit<SkeletonProps, 'variant'>) {
  return <Skeleton variant="text" lines={lines} {...props} />;
}

export function SkeletonAvatar({ size = 40, ...props }: Omit<SkeletonProps, 'variant'> & { size?: number }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      {...props}
    />
  );
}

export function SkeletonCard({ ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center space-x-3">
        <SkeletonAvatar size={48} />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <Skeleton variant="rectangular" height={200} className="rounded-lg" />
    </div>
  );
}