// Premium Shadow System
export const shadows = {
  // Elevation shadows
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Premium shadows
  soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  hard: '0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  
  // Colored shadows
  'primary-sm': '0 4px 14px 0 rgba(14, 165, 233, 0.15)',
  'primary-md': '0 8px 25px -8px rgba(14, 165, 233, 0.25)',
  'primary-lg': '0 16px 40px -12px rgba(14, 165, 233, 0.35)',
  
  'secondary-sm': '0 4px 14px 0 rgba(217, 70, 239, 0.15)',
  'secondary-md': '0 8px 25px -8px rgba(217, 70, 239, 0.25)',
  'secondary-lg': '0 16px 40px -12px rgba(217, 70, 239, 0.35)',
  
  'success-sm': '0 4px 14px 0 rgba(34, 197, 94, 0.15)',
  'success-md': '0 8px 25px -8px rgba(34, 197, 94, 0.25)',
  'success-lg': '0 16px 40px -12px rgba(34, 197, 94, 0.35)',
  
  'error-sm': '0 4px 14px 0 rgba(239, 68, 68, 0.15)',
  'error-md': '0 8px 25px -8px rgba(239, 68, 68, 0.25)',
  'error-lg': '0 16px 40px -12px rgba(239, 68, 68, 0.35)',
  
  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  'inner-lg': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
} as const;

// Shadow utility classes
export const shadowStyles = {
  'elevation-1': 'shadow-xs',
  'elevation-2': 'shadow-sm',
  'elevation-3': 'shadow-md',
  'elevation-4': 'shadow-lg',
  'elevation-5': 'shadow-xl',
  'elevation-6': 'shadow-2xl',
  
  'floating': 'shadow-soft',
  'modal': 'shadow-hard',
  'card': 'shadow-medium',
  'button': 'shadow-sm hover:shadow-md',
} as const;