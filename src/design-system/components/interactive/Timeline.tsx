'use client';

import React from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';
import { cn, glass } from '../../themes/theme-utils';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  status?: 'completed' | 'current' | 'upcoming' | 'locked';
  icon?: React.ReactNode;
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral';
  metadata?: Record<string, string | number>;
  children?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface TimelineProps {
  items: TimelineItem[];
  variant?: 'default' | 'compact' | 'detailed' | 'cards';
  orientation?: 'vertical' | 'horizontal';
  alignment?: 'left' | 'center' | 'right' | 'alternate';
  animated?: boolean;
  connectorStyle?: 'solid' | 'dashed' | 'dotted' | 'gradient';
  showProgress?: boolean;
  className?: string;
  itemClassName?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const statusColors = {
  completed: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    glow: 'shadow-green-500/30',
  },
  current: {
    bg: 'bg-primary-500',
    text: 'text-primary-500',
    border: 'border-primary-500',
    glow: 'shadow-primary-500/30',
  },
  upcoming: {
    bg: 'bg-slate-300 dark:bg-slate-600',
    text: 'text-slate-400 dark:text-slate-500',
    border: 'border-slate-300 dark:border-slate-600',
    glow: '',
  },
  locked: {
    bg: 'bg-slate-200 dark:bg-slate-700',
    text: 'text-slate-300 dark:text-slate-600',
    border: 'border-slate-200 dark:border-slate-700',
    glow: '',
  },
};

const colorClasses = {
  primary: statusColors.current,
  secondary: {
    bg: 'bg-secondary-500',
    text: 'text-secondary-500',
    border: 'border-secondary-500',
    glow: 'shadow-secondary-500/30',
  },
  success: statusColors.completed,
  warning: {
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    border: 'border-amber-500',
    glow: 'shadow-amber-500/30',
  },
  danger: {
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    glow: 'shadow-red-500/30',
  },
  neutral: statusColors.upcoming,
};

function TimelineNode({
  item,
  isLast,
  isFirst,
  variant,
  alignment,
  connectorStyle,
  animated,
  index,
  totalItems,
  itemClassName,
}: {
  item: TimelineItem;
  isLast: boolean;
  isFirst: boolean;
  variant: TimelineProps['variant'];
  alignment: TimelineProps['alignment'];
  connectorStyle: TimelineProps['connectorStyle'];
  animated: boolean;
  index: number;
  totalItems: number;
  itemClassName?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;
  const isAlternate = alignment === 'alternate';
  const isRightSide = isAlternate ? index % 2 === 1 : alignment === 'right';

  const status = item.status || 'upcoming';
  const colors = item.color ? colorClasses[item.color] : statusColors[status];

  const connectorClasses = {
    solid: 'border-l-2',
    dashed: 'border-l-2 border-dashed',
    dotted: 'border-l-2 border-dotted',
    gradient: 'bg-gradient-to-b from-primary-500 to-secondary-500 w-0.5',
  };

  const ContentWrapper = item.onClick || item.href ? motion.button : motion.div;

  const renderIcon = () => (
    <div className="relative">
      {/* Glow effect for current item */}
      {status === 'current' && shouldAnimate && (
        <motion.div
          className={cn('absolute inset-0 rounded-full', colors.bg, 'blur-md')}
          variants={pulseVariants}
          animate="pulse"
        />
      )}

      {/* Node circle */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-center rounded-full',
          'border-4 bg-white dark:bg-slate-900',
          colors.border,
          variant === 'compact' ? 'w-4 h-4' : 'w-10 h-10',
          status === 'current' && 'shadow-lg',
          colors.glow
        )}
      >
        {item.icon && variant !== 'compact' && (
          <span className={cn('text-sm', colors.text)}>{item.icon}</span>
        )}
        {!item.icon && status === 'completed' && variant !== 'compact' && (
          <svg
            className={cn('w-5 h-5', colors.text)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {status === 'locked' && variant !== 'compact' && (
          <svg
            className={cn('w-4 h-4', colors.text)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        )}
      </div>
    </div>
  );

  const renderContent = () => (
    <ContentWrapper
      className={cn(
        'flex-1 text-left',
        variant === 'cards' &&
          cn(
            glass.card.standard,
            'rounded-xl p-4',
            'hover:shadow-lg transition-shadow duration-200'
          ),
        variant === 'detailed' && 'pb-8',
        (item.onClick || item.href) && 'cursor-pointer hover:opacity-80',
        itemClassName
      )}
      onClick={item.onClick}
      {...((item.onClick || item.href) &&
        shouldAnimate && { whileHover: { scale: 1.02 } })}
      {...((item.onClick || item.href) &&
        shouldAnimate && { whileTap: { scale: 0.98 } })}
    >
      {/* Date/Time */}
      {(item.date || item.time) && (
        <div
          className={cn(
            'text-xs font-medium mb-1',
            status === 'completed'
              ? 'text-slate-500 dark:text-slate-400'
              : colors.text
          )}
        >
          {item.date && <span>{item.date}</span>}
          {item.date && item.time && <span className="mx-1">at</span>}
          {item.time && <span>{item.time}</span>}
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'font-semibold',
          variant === 'compact' ? 'text-sm' : 'text-base',
          status === 'locked'
            ? 'text-slate-400 dark:text-slate-500'
            : 'text-slate-900 dark:text-white'
        )}
      >
        {item.title}
      </h3>

      {/* Description */}
      {item.description && variant !== 'compact' && (
        <p
          className={cn(
            'mt-1 text-sm',
            status === 'locked'
              ? 'text-slate-300 dark:text-slate-600'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          {item.description}
        </p>
      )}

      {/* Metadata */}
      {item.metadata && variant === 'detailed' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(item.metadata).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {key}: {value}
            </span>
          ))}
        </div>
      )}

      {/* Children */}
      {item.children && variant !== 'compact' && (
        <div className="mt-3">{item.children}</div>
      )}
    </ContentWrapper>
  );

  const progressPercentage =
    ((index + (status === 'completed' ? 1 : 0)) / totalItems) * 100;

  return (
    <motion.div
      {...(shouldAnimate && { variants: itemVariants })}
      className={cn(
        'relative flex',
        isAlternate && 'flex-col md:flex-row',
        alignment === 'center' && !isAlternate && 'flex-col items-center',
        isRightSide && !isAlternate && 'flex-row-reverse',
        variant === 'compact' && 'gap-3',
        variant !== 'compact' && 'gap-4'
      )}
    >
      {/* For alternate layout - show date on opposite side on larger screens */}
      {isAlternate && (
        <div
          className={cn(
            'hidden md:block md:w-1/2',
            isRightSide ? 'text-left md:pr-8' : 'text-right md:pl-8'
          )}
        >
          {(item.date || item.time) && (
            <div
              className={cn(
                'text-sm font-medium',
                status === 'completed' ? 'text-slate-500' : colors.text
              )}
            >
              {item.date && <div>{item.date}</div>}
              {item.time && (
                <div className="text-xs opacity-70">{item.time}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Node and connector */}
      <div
        className={cn(
          'relative flex flex-col items-center',
          isAlternate && 'md:absolute md:left-1/2 md:-translate-x-1/2'
        )}
      >
        {renderIcon()}

        {/* Connector line */}
        {!isLast && (
          <div
            className={cn(
              'flex-1 min-h-[40px]',
              connectorStyle === 'gradient'
                ? connectorClasses.gradient
                : cn(
                    connectorClasses[connectorStyle || 'solid'],
                    colors.border
                  ),
              variant === 'compact' && 'min-h-[24px]'
            )}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1',
          isAlternate &&
            cn('md:w-1/2', isRightSide ? 'md:text-right md:pl-8' : 'md:pr-8'),
          !isAlternate && alignment === 'center' && 'text-center'
        )}
      >
        {renderContent()}
      </div>
    </motion.div>
  );
}

export function Timeline({
  items,
  variant = 'default',
  orientation = 'vertical',
  alignment = 'left',
  animated = true,
  connectorStyle = 'solid',
  showProgress = false,
  className,
  itemClassName,
}: TimelineProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  const completedCount = items.filter(
    item => item.status === 'completed'
  ).length;
  const progressPercentage = (completedCount / items.length) * 100;

  if (orientation === 'horizontal') {
    return (
      <div className={cn('relative', className)}>
        {/* Progress bar */}
        {showProgress && (
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}

        <motion.div
          className="flex overflow-x-auto pb-4 gap-8"
          {...(shouldAnimate && { variants: containerVariants })}
          initial="hidden"
          animate="visible"
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              {...(shouldAnimate && { variants: itemVariants })}
              className="flex-shrink-0 flex flex-col items-center text-center"
              style={{ minWidth: '150px' }}
            >
              <TimelineNode
                item={item}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                variant={variant}
                alignment="center"
                connectorStyle={connectorStyle}
                animated={animated}
                index={index}
                totalItems={items.length}
                {...(itemClassName && { itemClassName })}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {completedCount}/{items.length}
          </span>
        </div>
      )}

      <motion.div
        className={cn(
          'space-y-0',
          alignment === 'alternate' && 'max-w-4xl mx-auto'
        )}
        {...(shouldAnimate && { variants: containerVariants })}
        initial="hidden"
        animate="visible"
      >
        {items.map((item, index) => (
          <TimelineNode
            key={item.id}
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            variant={variant}
            alignment={alignment}
            connectorStyle={connectorStyle}
            animated={animated}
            index={index}
            totalItems={items.length}
            {...(itemClassName && { itemClassName })}
          />
        ))}
      </motion.div>
    </div>
  );
}

// Sample data generator for demos
export function generateSampleTimelineData(): TimelineItem[] {
  return [
    {
      id: '1',
      title: 'Course Enrolled',
      description: 'Successfully enrolled in Advanced Mathematics',
      date: 'Jan 5, 2024',
      status: 'completed',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      id: '2',
      title: 'Module 1: Foundations',
      description: 'Introduction to algebraic concepts and basic operations',
      date: 'Jan 8, 2024',
      status: 'completed',
      metadata: { Duration: '2 hours', Score: '95%' },
    },
    {
      id: '3',
      title: 'Module 2: Equations',
      description: 'Linear equations and problem-solving techniques',
      date: 'Jan 15, 2024',
      status: 'current',
      metadata: { Duration: '3 hours', Progress: '60%' },
    },
    {
      id: '4',
      title: 'Module 3: Functions',
      description: 'Understanding functions and their applications',
      date: 'Jan 22, 2024',
      status: 'upcoming',
    },
    {
      id: '5',
      title: 'Final Assessment',
      description: 'Comprehensive test covering all modules',
      date: 'Jan 30, 2024',
      status: 'locked',
    },
  ];
}
