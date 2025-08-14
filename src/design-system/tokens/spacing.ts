// Premium Spacing System
export const spacing = {
  // Base spacing scale
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  18: '4.5rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  88: '22rem',
  96: '24rem',
  128: '32rem',
} as const;

// Semantic spacing tokens
export const semanticSpacing = {
  // Component spacing
  'component-xs': '0.5rem',
  'component-sm': '0.75rem',
  'component-md': '1rem',
  'component-lg': '1.5rem',
  'component-xl': '2rem',
  
  // Layout spacing
  'layout-xs': '1rem',
  'layout-sm': '1.5rem',
  'layout-md': '2rem',
  'layout-lg': '3rem',
  'layout-xl': '4rem',
  'layout-2xl': '6rem',
  
  // Section spacing
  'section-xs': '2rem',
  'section-sm': '3rem',
  'section-md': '4rem',
  'section-lg': '6rem',
  'section-xl': '8rem',
} as const;

// Grid system
export const grid = {
  columns: 12,
  gutters: {
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '2.5rem',
    xl: '3rem',
  },
  maxWidths: {
    xs: '20rem',
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    full: '100%',
  },
} as const;