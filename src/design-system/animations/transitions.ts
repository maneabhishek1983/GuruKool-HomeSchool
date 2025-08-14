// Premium Transition Presets
export const transitions = {
  // Easing functions
  easing: {
    easeInOut: [0.4, 0, 0.2, 1],
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
    sharp: [0.4, 0, 0.6, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    elastic: [0.25, 0.46, 0.45, 0.94],
  },
  
  // Duration presets
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
  },
  
  // Common transitions
  smooth: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
  
  snappy: {
    duration: 0.15,
    ease: [0.4, 0, 0.6, 1],
  },
  
  bouncy: {
    duration: 0.5,
    ease: [0.68, -0.55, 0.265, 1.55],
  },
  
  elastic: {
    duration: 0.8,
    ease: [0.25, 0.46, 0.45, 0.94],
  },
} as const;

// Page transition variants
export const pageTransitions = {
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};