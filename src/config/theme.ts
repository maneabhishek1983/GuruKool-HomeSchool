/**
 * GuruKool Theme Configuration
 *
 * Centralized theme configuration for the GuruKool HomeSchool platform.
 * This theme is designed to be professional yet approachable, suitable for
 * parents, teachers, students, and administrators.
 */

export const gurukoolTheme = {
  name: 'GuruKool',
  description: 'Professional education platform theme',

  colors: {
    primary: {
      main: '#2563EB',
      dark: '#1E40AF',
      light: '#3B82F6',
      lighter: '#60A5FA',
      lightest: '#DBEAFE',
    },
    secondary: {
      main: '#14B8A6',
      dark: '#0D9488',
      light: '#2DD4BF',
      lighter: '#5EEAD4',
      lightest: '#CCFBF1',
    },
    accent: {
      main: '#F59E0B',
      dark: '#D97706',
      light: '#FBBF24',
      lighter: '#FCD34D',
      lightest: '#FEF3C7',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    neutral: {
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray300: '#D1D5DB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray600: '#4B5563',
      gray700: '#374151',
      gray800: '#1F2937',
      gray900: '#111827',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },

  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    secondary: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
    hero: 'linear-gradient(135deg, #2563EB 0%, #14B8A6 50%, #F59E0B 100%)',
    card: 'linear-gradient(145deg, #FFFFFF 0%, #F9FAFB 100%)',
  },

  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export default gurukoolTheme;
