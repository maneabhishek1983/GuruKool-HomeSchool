'use client';

import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn, themeClasses } from '../../themes/theme-utils';
import { Card } from '../base/Card';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  action: () => void;
}

interface GestureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  swipeActions?: {
    left?: SwipeAction[];
    right?: SwipeAction[];
  };
  dragEnabled?: boolean;
  hapticFeedback?: boolean;
  onSwipe?: (direction: 'left' | 'right', action: SwipeAction) => void;
  swipeThreshold?: number;
}

const actionColors = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-purple-500 text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  danger: 'bg-red-500 text-white',
};

export function GestureCard({
  children,
  swipeActions,
  dragEnabled = true,
  hapticFeedback = true,
  onSwipe,
  swipeThreshold = 100,
  className,
  ...props
}: GestureCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  );

  const x = useMotionValue(0);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 0.8, 1, 0.8, 0.5]
  );
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  // Transform for action visibility
  const leftActionOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);
  const rightActionOpacity = useTransform(x, [-swipeThreshold, 0], [1, 0]);

  const triggerHapticFeedback = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
    triggerHapticFeedback();
  };

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const currentX = info.offset.x;

    if (Math.abs(currentX) > swipeThreshold / 2) {
      const direction = currentX > 0 ? 'right' : 'left';
      if (swipeDirection !== direction) {
        setSwipeDirection(direction);
        triggerHapticFeedback();
      }
    } else {
      setSwipeDirection(null);
    }
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    setSwipeDirection(null);

    const currentX = info.offset.x;
    const velocity = info.velocity.x;

    // Determine if swipe threshold was met
    if (Math.abs(currentX) > swipeThreshold || Math.abs(velocity) > 500) {
      const direction = currentX > 0 ? 'right' : 'left';
      const actions =
        direction === 'right' ? swipeActions?.right : swipeActions?.left;

      if (actions && actions.length > 0) {
        const action = actions[0]; // Use first action for now
        if (action) {
          triggerHapticFeedback();
          onSwipe?.(direction, action);
          action.action();
        }
      }
    }

    // Reset position
    x.set(0);
  };

  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (!actions || actions.length === 0) {
      return null;
    }

    return (
      <motion.div
        className={cn(
          'absolute top-0 bottom-0 flex items-center justify-center',
          'w-20 z-10',
          side === 'left' ? 'left-0' : 'right-0'
        )}
        style={{
          opacity: side === 'left' ? leftActionOpacity : rightActionOpacity,
        }}
      >
        <div className="flex flex-col gap-1">
          {actions.slice(0, 2).map(action => (
            <motion.button
              key={action.id}
              className={cn(
                'p-2 rounded-full shadow-lg',
                'flex items-center justify-center',
                'text-xs font-medium',
                actionColors[action.color]
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => {
                e.stopPropagation();
                action.action();
              }}
            >
              {action.icon || action.label.charAt(0).toUpperCase()}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left actions */}
      {swipeActions?.left && renderActions(swipeActions.left, 'left')}

      {/* Right actions */}
      {swipeActions?.right && renderActions(swipeActions.right, 'right')}

      {/* Main card */}
      <motion.div
        className={cn(
          'relative z-20',
          isDragging && 'cursor-grabbing',
          dragEnabled && 'cursor-grab',
          className
        )}
        style={{ x, opacity, scale } as any}
        drag={dragEnabled ? 'x' : false}
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        {...(handleDragStart ? { onDragStart: handleDragStart } : {})}
        {...(handleDrag ? { onDrag: handleDrag } : {})}
        {...(handleDragEnd ? { onDragEnd: handleDragEnd } : {})}
        {...(!isDragging ? { whileHover: { y: -2 } } : {})}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        {...(props as any)}
      >
        <Card
          variant="elevated"
          interactive={!isDragging}
          className={cn(
            'transition-shadow duration-200',
            isDragging && 'shadow-xl',
            swipeDirection === 'left' &&
              'shadow-red-200 dark:shadow-red-900/20',
            swipeDirection === 'right' &&
              'shadow-green-200 dark:shadow-green-900/20'
          )}
        >
          {children}
        </Card>
      </motion.div>
    </div>
  );
}

// Preset swipe actions
export const presetSwipeActions = {
  delete: {
    id: 'delete',
    label: 'Delete',
    color: 'danger' as const,
    action: () => console.log('Delete action'),
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    color: 'warning' as const,
    action: () => console.log('Archive action'),
  },
  favorite: {
    id: 'favorite',
    label: 'Favorite',
    color: 'success' as const,
    action: () => console.log('Favorite action'),
  },
  share: {
    id: 'share',
    label: 'Share',
    color: 'primary' as const,
    action: () => console.log('Share action'),
  },
};
