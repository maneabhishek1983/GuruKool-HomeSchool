import { Variants } from 'framer-motion';

// Premium Animation Presets
export const animationPresets = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },

  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },

  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  scaleInBounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    transition: {
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55],
    },
  },

  // Slide animations
  slideInUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },

  slideInDown: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },

  slideInLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },

  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },

  // Rotation animations
  rotateIn: {
    initial: { opacity: 0, rotate: -180 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 180 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },

  // Flip animations
  flipIn: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 90 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },

  // Elastic animations
  elasticIn: {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0 },
    transition: {
      duration: 0.8,
      ease: [0.68, -0.55, 0.265, 1.55],
    },
  },
} as const;

// Stagger animation variants
export const staggerVariants: Variants = {
  container: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  } as Variants[string],
  item: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  } as Variants[string],
};

// Hover and tap animations
export const interactionAnimations = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  tap: {
    scale: 0.95,
    transition: { duration: 0.1, ease: 'easeOut' },
  },

  buttonHover: {
    scale: 1.02,
    boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.25)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  buttonTap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeOut' },
  },

  cardHover: {
    y: -4,
    boxShadow: '0 16px 40px -12px rgba(0, 0, 0, 0.15)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};
