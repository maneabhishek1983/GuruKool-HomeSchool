import { Variants } from 'framer-motion';

// Component-specific animation variants
export const componentVariants = {
  // Modal variants
  modal: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    content: {
      initial: { opacity: 0, scale: 0.9, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.9, y: 20 },
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  },
  
  // Dropdown variants
  dropdown: {
    initial: { opacity: 0, scale: 0.95, y: -10 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.15, ease: 'easeOut' },
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.1, ease: 'easeIn' },
    },
  },
  
  // Toast variants
  toast: {
    initial: { opacity: 0, x: 300, scale: 0.9 },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    exit: { 
      opacity: 0, 
      x: 300, 
      scale: 0.9,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  },
  
  // Sidebar variants
  sidebar: {
    initial: { x: '-100%' },
    animate: { 
      x: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    exit: { 
      x: '-100%',
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  },
  
  // Tab variants
  tab: {
    inactive: { 
      opacity: 0.7,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
    active: { 
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2 },
    },
  },
  
  // Loading variants
  loading: {
    spin: {
      animate: { rotate: 360 },
      transition: { 
        duration: 1, 
        repeat: Infinity, 
        ease: 'linear' 
      },
    },
    pulse: {
      animate: { 
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7],
      },
      transition: { 
        duration: 1.5, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      },
    },
    bounce: {
      animate: { y: [0, -10, 0] },
      transition: { 
        duration: 0.6, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      },
    },
  },
} as const;

// List animation variants
export const listVariants: Variants = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  } as Variants[string],
  item: {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  } as Variants[string],
};

// Card animation variants
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 16px 40px -12px rgba(0, 0, 0, 0.15)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
};