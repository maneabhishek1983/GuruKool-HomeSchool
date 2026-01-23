'use client';

import React from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';
import { cn, glass, liquidGradient } from '../../themes/theme-utils';

export interface HeroSectionProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  media?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'centered' | 'split' | 'minimal';
  background?: 'gradient' | 'mesh' | 'solid' | 'image' | 'glass' | 'animated';
  gradientTheme?: 'primary' | 'sunset' | 'ocean' | 'forest' | 'aurora';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  textAlign?: 'left' | 'center' | 'right';
  overlayOpacity?: number;
  backgroundImage?: string;
  className?: string;
  contentClassName?: string;
  animated?: boolean;
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

const floatVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const gradientAnimateVariants: Variants = {
  initial: { backgroundPosition: '0% 50%' },
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 15,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

const sizeClasses = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-24',
  lg: 'py-24 md:py-32',
  xl: 'py-32 md:py-40',
  full: 'min-h-screen py-16',
};

const textAlignClasses = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
};

const backgroundClasses = {
  gradient: {
    primary: liquidGradient.background.primary,
    sunset: liquidGradient.background.sunset,
    ocean: liquidGradient.background.ocean,
    forest: liquidGradient.background.forest,
    aurora: liquidGradient.background.aurora,
  },
  solid: 'bg-slate-900 dark:bg-slate-950',
  glass: glass.card.frosted,
};

// Mesh gradient background component
function MeshGradientBackground({ theme }: { theme: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full">
        <motion.div
          className={cn(
            'absolute w-[80vw] h-[80vw] rounded-full blur-3xl',
            theme === 'primary' && 'bg-primary-500/30',
            theme === 'sunset' && 'bg-amber-500/30',
            theme === 'ocean' && 'bg-cyan-500/30',
            theme === 'forest' && 'bg-green-500/30',
            theme === 'aurora' && 'bg-violet-500/30'
          )}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full">
        <motion.div
          className={cn(
            'absolute w-[60vw] h-[60vw] rounded-full blur-3xl',
            theme === 'primary' && 'bg-secondary-500/30',
            theme === 'sunset' && 'bg-red-500/30',
            theme === 'ocean' && 'bg-blue-500/30',
            theme === 'forest' && 'bg-emerald-500/30',
            theme === 'aurora' && 'bg-pink-500/30'
          )}
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className={cn(
            'absolute w-[50vw] h-[50vw] rounded-full blur-3xl',
            theme === 'primary' && 'bg-violet-500/20',
            theme === 'sunset' && 'bg-pink-500/20',
            theme === 'ocean' && 'bg-violet-500/20',
            theme === 'forest' && 'bg-cyan-500/20',
            theme === 'aurora' && 'bg-cyan-500/20'
          )}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
}

// Animated gradient background
function AnimatedGradientBackground({ theme }: { theme: string }) {
  return (
    <motion.div
      className={cn(
        'absolute inset-0 bg-[length:400%_400%]',
        theme === 'primary' &&
          'bg-gradient-to-br from-primary-500 via-violet-500 to-secondary-500',
        theme === 'sunset' &&
          'bg-gradient-to-br from-amber-500 via-red-500 to-pink-500',
        theme === 'ocean' &&
          'bg-gradient-to-br from-cyan-500 via-blue-500 to-violet-500',
        theme === 'forest' &&
          'bg-gradient-to-br from-green-500 via-emerald-500 to-cyan-500',
        theme === 'aurora' &&
          'bg-gradient-to-br from-violet-500 via-pink-500 to-cyan-500'
      )}
      variants={gradientAnimateVariants}
      initial="initial"
      animate="animate"
    />
  );
}

export function HeroSection({
  title,
  subtitle,
  description,
  children,
  actions,
  media,
  badge,
  variant = 'default',
  background = 'gradient',
  gradientTheme = 'primary',
  size = 'lg',
  textAlign = 'center',
  overlayOpacity = 0,
  backgroundImage,
  className,
  contentClassName,
  animated = true,
}: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  const renderBackground = () => {
    switch (background) {
      case 'mesh':
        return <MeshGradientBackground theme={gradientTheme} />;
      case 'animated':
        return <AnimatedGradientBackground theme={gradientTheme} />;
      case 'image':
        return backgroundImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        ) : null;
      default:
        return null;
    }
  };

  const renderContent = () => {
    const contentElements = (
      <>
        {/* Badge */}
        {badge && (
          <motion.div
            {...(shouldAnimate && { variants: itemVariants })}
            className="mb-4"
          >
            {badge}
          </motion.div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <motion.div
            {...(shouldAnimate && { variants: itemVariants })}
            className="text-sm md:text-base font-medium tracking-wider uppercase text-white/70 mb-4"
          >
            {subtitle}
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          {...(shouldAnimate && { variants: itemVariants })}
          className={cn(
            'font-bold tracking-tight',
            'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
            'text-white',
            variant === 'minimal' && 'text-2xl sm:text-3xl md:text-4xl'
          )}
        >
          {title}
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.div
            {...(shouldAnimate && { variants: itemVariants })}
            className={cn(
              'mt-6 text-base sm:text-lg md:text-xl',
              'text-white/80 max-w-3xl',
              textAlign === 'center' && 'mx-auto'
            )}
          >
            {description}
          </motion.div>
        )}

        {/* Actions */}
        {actions && (
          <motion.div
            {...(shouldAnimate && { variants: itemVariants })}
            className={cn(
              'mt-8 flex flex-wrap gap-4',
              textAlign === 'center' && 'justify-center',
              textAlign === 'right' && 'justify-end'
            )}
          >
            {actions}
          </motion.div>
        )}

        {/* Additional children */}
        {children && (
          <motion.div
            {...(shouldAnimate && { variants: itemVariants })}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </>
    );

    if (variant === 'split' && media) {
      return (
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={cn('flex flex-col', textAlignClasses[textAlign])}>
            {contentElements}
          </div>
          <motion.div
            {...(shouldAnimate && { variants: floatVariants })}
            initial="initial"
            animate="animate"
            className="relative"
          >
            {media}
          </motion.div>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col', textAlignClasses[textAlign])}>
        {contentElements}
        {media && (
          <motion.div
            {...(shouldAnimate && { variants: itemVariants })}
            className="mt-12"
          >
            {media}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        sizeClasses[size],
        background === 'gradient' && backgroundClasses.gradient[gradientTheme],
        background === 'solid' && backgroundClasses.solid,
        background === 'glass' && backgroundClasses.glass,
        className
      )}
    >
      {/* Background */}
      {renderBackground()}

      {/* Overlay */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content container */}
      <motion.div
        className={cn(
          'relative z-10 container mx-auto px-4 sm:px-6 lg:px-8',
          contentClassName
        )}
        {...(shouldAnimate && { variants: containerVariants })}
        initial="hidden"
        animate="visible"
      >
        {renderContent()}
      </motion.div>
    </section>
  );
}

// Hero badge component
export function HeroBadge({
  children,
  icon,
  variant = 'glass',
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'glass' | 'solid' | 'outline';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
        variant === 'glass' &&
          'bg-white/10 backdrop-blur-md border border-white/20 text-white',
        variant === 'solid' && 'bg-white text-slate-900',
        variant === 'outline' && 'border-2 border-white/50 text-white',
        className
      )}
    >
      {icon && <span className="text-current">{icon}</span>}
      {children}
    </span>
  );
}

// Hero CTA button
export function HeroCTA({
  children,
  variant = 'solid',
  size = 'lg',
  icon,
  iconPosition = 'right',
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'solid' | 'glass' | 'outline';
  size?: 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeStyles = {
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    xl: 'px-10 py-5 text-lg',
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center gap-2 rounded-xl font-semibold',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50',
        sizeStyles[size],
        variant === 'solid' &&
          'bg-white text-slate-900 hover:bg-white/90 shadow-xl',
        variant === 'glass' &&
          'bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20',
        variant === 'outline' &&
          'border-2 border-white text-white hover:bg-white/10',
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...(props as Record<string, unknown>)}
    >
      {icon && iconPosition === 'left' && <span>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span>{icon}</span>}
    </motion.button>
  );
}
