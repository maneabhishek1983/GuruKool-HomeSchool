'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/design-system/themes/theme-utils';
import {
  glassStyles,
  liquidGradients,
} from '@/design-system/tokens/glassmorphism';

interface LiquidLearningLayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'dashboard' | 'auth' | 'landing';
  gradientTheme?: 'primary' | 'sunset' | 'ocean' | 'forest' | 'aurora';
  showMeshBackground?: boolean;
  showParticles?: boolean;
  className?: string;
}

// Animated mesh gradient orbs
function MeshBackgroundOrbs({ theme }: { theme: string }) {
  const orbColors = {
    primary: ['bg-sky-500/30', 'bg-violet-500/30', 'bg-fuchsia-500/30'],
    sunset: ['bg-amber-500/30', 'bg-red-500/30', 'bg-pink-500/30'],
    ocean: ['bg-cyan-500/30', 'bg-blue-500/30', 'bg-violet-500/30'],
    forest: ['bg-green-500/30', 'bg-emerald-500/30', 'bg-cyan-500/30'],
    aurora: ['bg-violet-500/30', 'bg-pink-500/30', 'bg-cyan-500/30'],
  };

  const colors =
    orbColors[theme as keyof typeof orbColors] || orbColors.primary;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large primary orb - top left */}
      <motion.div
        className={cn(
          'absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-3xl',
          colors[0]
        )}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary orb - bottom right */}
      <motion.div
        className={cn(
          'absolute -bottom-[20%] -right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-3xl',
          colors[1]
        )}
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Tertiary orb - center */}
      <motion.div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full blur-3xl',
          colors[2]
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Floating particles effect
function FloatingParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.initialX}%`,
            top: `${particle.initialY}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Noise texture overlay for depth
function NoiseOverlay() {
  return (
    <div
      className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// Base gradient backgrounds
const baseBackgrounds = {
  default: 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
  dashboard: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
  auth: 'bg-gradient-to-br from-slate-900 via-violet-900/50 to-slate-900',
  landing: 'bg-gradient-to-br from-white via-slate-50 to-white',
};

export function LiquidLearningLayout({
  children,
  variant = 'default',
  gradientTheme = 'primary',
  showMeshBackground = true,
  showParticles = false,
  className,
}: LiquidLearningLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkVariant = variant === 'dashboard' || variant === 'auth';

  return (
    <div
      className={cn(
        'relative min-h-screen overflow-x-hidden',
        baseBackgrounds[variant],
        className
      )}
    >
      {/* Animated mesh background */}
      {showMeshBackground && mounted && (
        <MeshBackgroundOrbs theme={gradientTheme} />
      )}

      {/* Floating particles */}
      {showParticles && mounted && <FloatingParticles />}

      {/* Noise texture */}
      <NoiseOverlay />

      {/* Main content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </div>
    </div>
  );
}

// Glass Card component for consistent styling
export function GlassCard({
  children,
  variant = 'standard',
  hover = true,
  className,
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'subtle' | 'standard' | 'frosted' | 'solid';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={cn(
        'rounded-2xl transition-all duration-300',
        glassStyles.card[variant],
        hover && 'hover:shadow-xl hover:scale-[1.02]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...(hover && { whileHover: { y: -4 } })}
      {...(hover && onClick && { whileTap: { scale: 0.98 } })}
    >
      {children}
    </Component>
  );
}

// Glass Navigation Header
export function GlassHeader({
  children,
  className,
  sticky = true,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
        'border-b border-white/20 dark:border-slate-700/50',
        'shadow-lg shadow-slate-900/5',
        sticky && 'sticky top-0 z-50',
        className
      )}
    >
      {children}
    </motion.header>
  );
}

// Stats Card with glass effect
export function GlassStatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'primary',
  className,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}) {
  const colorClasses = {
    primary: 'from-sky-500 to-blue-600',
    secondary: 'from-violet-500 to-purple-600',
    success: 'from-green-500 to-emerald-600',
    warning: 'from-amber-500 to-orange-600',
    error: 'from-red-500 to-rose-600',
  };

  const iconBgClasses = {
    primary: 'bg-sky-100 text-sky-600',
    secondary: 'bg-violet-100 text-violet-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        'bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg',
        'rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50',
        'shadow-lg hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {value}
          </p>
          {trend && trendValue && (
            <div
              className={cn(
                'flex items-center mt-2 text-sm font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-slate-500'
              )}
            >
              {trend === 'up' && (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17l9.2-9.2M17 17V7m0 10H7"
                  />
                </svg>
              )}
              {trend === 'down' && (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 7l-9.2 9.2M7 7v10m0-10h10"
                  />
                </svg>
              )}
              {trendValue}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center',
              iconBgClasses[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Action Button with liquid effect
export function LiquidButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'glass' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'>) {
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30',
    secondary:
      'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30',
    success:
      'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30',
    glass:
      'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
    outline:
      'bg-transparent border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const { onClick, disabled, type, ...restProps } = props;

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </motion.button>
  );
}

// Section Title with gradient
export function SectionTitle({
  children,
  subtitle,
  className,
}: {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-8', className)}>
      <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

export default LiquidLearningLayout;
