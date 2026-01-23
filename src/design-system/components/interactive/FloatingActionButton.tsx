'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn, glass, liquidGradient } from '../../themes/theme-utils';

export interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}

export interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  expandedIcon?: React.ReactNode;
  actions?: FABAction[];
  position?:
    | 'bottom-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'top-right'
    | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'glass' | 'gradient';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  label?: string;
  showLabel?: boolean;
  onClick?: () => void;
  hapticFeedback?: boolean;
  expandDirection?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  offset?: { x?: number; y?: number };
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const sizeClasses = {
  sm: 'w-12 h-12 text-lg',
  md: 'w-14 h-14 text-xl',
  lg: 'w-16 h-16 text-2xl',
};

const actionSizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-14 h-14 text-lg',
};

const colorClasses = {
  solid: {
    primary:
      'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30',
    secondary:
      'bg-secondary-500 hover:bg-secondary-600 text-white shadow-lg shadow-secondary-500/30',
    success:
      'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30',
    warning:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30',
    danger:
      'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30',
  },
  glass: {
    primary: `${glass.button.primary}`,
    secondary: `${glass.button.secondary}`,
    success:
      'bg-green-500/80 hover:bg-green-500/90 backdrop-blur-md border border-green-400/30 text-white shadow-lg shadow-green-500/25',
    warning:
      'bg-amber-500/80 hover:bg-amber-500/90 backdrop-blur-md border border-amber-400/30 text-white shadow-lg shadow-amber-500/25',
    danger:
      'bg-red-500/80 hover:bg-red-500/90 backdrop-blur-md border border-red-400/30 text-white shadow-lg shadow-red-500/25',
  },
  gradient: {
    primary: `${liquidGradient.background.primary} text-white shadow-xl shadow-primary-500/30`,
    secondary: `${liquidGradient.background.sunset} text-white shadow-xl shadow-pink-500/30`,
    success: `${liquidGradient.background.forest} text-white shadow-xl shadow-green-500/30`,
    warning: `bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-xl shadow-orange-500/30`,
    danger: `bg-gradient-to-br from-red-500 via-pink-500 to-rose-600 text-white shadow-xl shadow-red-500/30`,
  },
};

const fabVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

const actionContainerVariants: Variants = {
  closed: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
  open: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const getActionItemVariants = (
  direction: 'up' | 'down' | 'left' | 'right'
): Variants => {
  const offsetMap = {
    up: { x: 0, y: 20 },
    down: { x: 0, y: -20 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  };

  return {
    closed: {
      scale: 0,
      opacity: 0,
      ...offsetMap[direction],
    },
    open: {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
  };
};

const iconRotateVariants: Variants = {
  closed: { rotate: 0 },
  open: { rotate: 45 },
};

export function FloatingActionButton({
  icon,
  expandedIcon,
  actions = [],
  position = 'bottom-right',
  size = 'md',
  variant = 'solid',
  color = 'primary',
  label,
  showLabel = false,
  onClick,
  hapticFeedback = true,
  expandDirection = 'up',
  className,
  offset = {},
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const triggerHapticFeedback = useCallback(() => {
    if (
      hapticFeedback &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  const handleMainClick = useCallback(() => {
    triggerHapticFeedback();

    if (actions.length > 0) {
      setIsExpanded(prev => !prev);
    } else if (onClick) {
      onClick();
    }
  }, [actions.length, onClick, triggerHapticFeedback]);

  const handleActionClick = useCallback(
    (action: FABAction) => {
      if (action.disabled) {
        return;
      }

      triggerHapticFeedback();
      action.onClick();
      setIsExpanded(false);
    },
    [triggerHapticFeedback]
  );

  const getActionContainerClasses = () => {
    const directionClasses = {
      up: 'flex-col-reverse bottom-full mb-3',
      down: 'flex-col top-full mt-3',
      left: 'flex-row-reverse right-full mr-3',
      right: 'flex-row left-full ml-3',
    };
    return directionClasses[expandDirection];
  };

  const actionItemVariants = getActionItemVariants(expandDirection);

  const offsetStyle = {
    ...(offset.x && {
      [position.includes('right') ? 'right' : 'left']: `${offset.x}px`,
    }),
    ...(offset.y && {
      [position.includes('top') ? 'top' : 'bottom']: `${offset.y}px`,
    }),
  };

  return (
    <>
      {/* Backdrop for closing */}
      <AnimatePresence>
        {isExpanded && actions.length > 0 && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div
        className={cn('fixed z-50', positionClasses[position], className)}
        style={offsetStyle}
      >
        {/* Action Items */}
        <AnimatePresence>
          {isExpanded && actions.length > 0 && (
            <motion.div
              className={cn(
                'absolute flex items-center gap-3',
                getActionContainerClasses()
              )}
              variants={actionContainerVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {actions.map(action => (
                <motion.div
                  key={action.id}
                  className="relative group"
                  variants={actionItemVariants}
                >
                  {/* Action label tooltip */}
                  <div
                    className={cn(
                      'absolute whitespace-nowrap px-3 py-1.5 rounded-lg',
                      'bg-slate-900/90 text-white text-sm font-medium',
                      'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                      'pointer-events-none backdrop-blur-sm',
                      expandDirection === 'up' || expandDirection === 'down'
                        ? 'right-full mr-3 top-1/2 -translate-y-1/2'
                        : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
                    )}
                  >
                    {action.label}
                  </div>

                  {/* Action button */}
                  <motion.button
                    className={cn(
                      'rounded-full flex items-center justify-center',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50',
                      actionSizeClasses[size],
                      action.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer',
                      colorClasses[variant][action.color || color]
                    )}
                    {...(!action.disabled && { whileHover: { scale: 1.1 } })}
                    {...(!action.disabled && { whileTap: { scale: 0.95 } })}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    aria-label={action.label}
                  >
                    {action.icon}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          className={cn(
            'rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50',
            sizeClasses[size],
            colorClasses[variant][color],
            showLabel && label && 'px-6 rounded-full w-auto'
          )}
          variants={fabVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          onClick={handleMainClick}
          aria-label={label || 'Floating action button'}
          aria-expanded={isExpanded}
        >
          <motion.span
            {...(actions.length > 0 && { variants: iconRotateVariants })}
            animate={isExpanded ? 'open' : 'closed'}
            transition={{ duration: 0.2 }}
          >
            {isExpanded && expandedIcon
              ? expandedIcon
              : icon || (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                )}
          </motion.span>

          {showLabel && label && (
            <span className="ml-2 font-medium text-sm">{label}</span>
          )}
        </motion.button>
      </div>
    </>
  );
}

// Preset FAB configurations
export const fabPresets = {
  addContent: {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
    color: 'primary' as const,
  },
  compose: {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    color: 'secondary' as const,
  },
  navigation: {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    ),
    color: 'primary' as const,
  },
};

// Common action icons
export const fabActionIcons = {
  add: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ),
  edit: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  ),
  delete: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  share: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  ),
  camera: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  upload: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  ),
  document: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};
