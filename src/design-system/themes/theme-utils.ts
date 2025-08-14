import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme-aware class utilities
export const themeClasses = {
  // Background classes
  bg: {
    primary: 'bg-white dark:bg-slate-900',
    secondary: 'bg-slate-50 dark:bg-slate-800',
    surface: 'bg-white dark:bg-slate-800',
    elevated: 'bg-white dark:bg-slate-700',
  },
  
  // Text classes
  text: {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-600 dark:text-slate-400',
    muted: 'text-slate-500 dark:text-slate-500',
    disabled: 'text-slate-400 dark:text-slate-600',
  },
  
  // Border classes
  border: {
    default: 'border-slate-200 dark:border-slate-700',
    light: 'border-slate-100 dark:border-slate-800',
    strong: 'border-slate-300 dark:border-slate-600',
  },
  
  // Interactive classes
  interactive: {
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-800',
    active: 'active:bg-slate-100 dark:active:bg-slate-700',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
  },
  
  // Shadow classes
  shadow: {
    sm: 'shadow-sm dark:shadow-slate-900/20',
    md: 'shadow-md dark:shadow-slate-900/30',
    lg: 'shadow-lg dark:shadow-slate-900/40',
    xl: 'shadow-xl dark:shadow-slate-900/50',
  },
} as const;

// Generate theme-aware CSS variables
export function generateThemeVariables(theme: 'light' | 'dark') {
  const variables = {
    '--color-primary': theme === 'light' ? '#0ea5e9' : '#38bdf8',
    '--color-secondary': theme === 'light' ? '#d946ef' : '#e879f9',
    '--color-background': theme === 'light' ? '#ffffff' : '#0f172a',
    '--color-surface': theme === 'light' ? '#f8fafc' : '#1e293b',
    '--color-text-primary': theme === 'light' ? '#1e293b' : '#f1f5f9',
    '--color-text-secondary': theme === 'light' ? '#64748b' : '#94a3b8',
    '--color-border': theme === 'light' ? '#e2e8f0' : '#334155',
  };
  
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

// Responsive utilities
export const responsive = {
  // Breakpoint utilities
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:',
  
  // Container utilities
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  
  // Grid utilities
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-1 sm:grid-cols-2',
    cols3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  
  // Flex utilities
  flex: {
    col: 'flex flex-col',
    row: 'flex flex-row',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    around: 'flex items-center justify-around',
  },
} as const;

// Animation utilities
export const animations = {
  // Transition utilities
  transition: {
    all: 'transition-all duration-200 ease-in-out',
    colors: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',
  },
  
  // Transform utilities
  transform: {
    hover: 'hover:scale-105 hover:-translate-y-1',
    tap: 'active:scale-95',
    rotate: 'hover:rotate-3',
  },
  
  // Animation classes
  animate: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    scaleIn: 'animate-scale-in',
    pulse: 'animate-pulse-soft',
  },
} as const;