// Premium Border System
export const borders = {
  // Border widths
  widths: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
  
  // Border radius
  radius: {
    none: '0px',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  // Border styles
  styles: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none',
  },
} as const;

// Border utility classes
export const borderStyles = {
  // Semantic borders
  'card': 'border border-neutral-200 dark:border-neutral-800',
  'input': 'border border-neutral-300 dark:border-neutral-700 focus:border-primary-500',
  'button': 'border border-transparent',
  'divider': 'border-t border-neutral-200 dark:border-neutral-800',
  
  // Interactive borders
  'interactive': 'border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600',
  'focus': 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:border-primary-500',
  'error': 'border-error-500 focus:ring-error-500',
  'success': 'border-success-500 focus:ring-success-500',
} as const;