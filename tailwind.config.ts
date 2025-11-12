import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // GuruKool Education Theme - Professional yet approachable
        gurukool: {
          // Primary Blue - Trust, knowledge, professionalism
          primary: '#2563EB',
          'primary-dark': '#1E40AF',
          'primary-light': '#3B82F6',
          'primary-lighter': '#60A5FA',
          'primary-lightest': '#DBEAFE',

          // Secondary Teal - Growth, learning, freshness
          secondary: '#14B8A6',
          'secondary-dark': '#0D9488',
          'secondary-light': '#2DD4BF',
          'secondary-lighter': '#5EEAD4',
          'secondary-lightest': '#CCFBF1',

          // Accent Gold - Achievement, excellence
          accent: '#F59E0B',
          'accent-dark': '#D97706',
          'accent-light': '#FBBF24',
          'accent-lighter': '#FCD34D',
          'accent-lightest': '#FEF3C7',

          // Neutral Grays
          'gray-50': '#F9FAFB',
          'gray-100': '#F3F4F6',
          'gray-200': '#E5E7EB',
          'gray-300': '#D1D5DB',
          'gray-400': '#9CA3AF',
          'gray-500': '#6B7280',
          'gray-600': '#4B5563',
          'gray-700': '#374151',
          'gray-800': '#1F2937',
          'gray-900': '#111827',

          // Semantic Colors
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',

          // Backgrounds
          white: '#FFFFFF',
          'bg-light': '#F9FAFB',
          'bg-dark': '#111827',
        },
        // Netflix-inspired color palette (kept for backward compatibility)
        netflix: {
          red: '#e50914',
          'red-dark': '#b81d13',
          'red-light': '#ff6b6b',
          black: '#000000',
          'dark-gray': '#141414',
          'medium-gray': '#333333',
          'light-gray': '#666666',
          'text-gray': '#b3b3b3',
          white: '#ffffff',
        },
        // Amazon-inspired color palette (kept for backward compatibility)
        amazon: {
          orange: '#ff9900',
          'orange-dark': '#e68a00',
          'orange-light': '#ffb84d',
          blue: '#232f3e',
          'blue-light': '#37475a',
          white: '#ffffff',
          'light-gray': '#f8f9fa',
          'medium-gray': '#d5d9d9',
          'text-gray': '#565959',
          'text-light': '#a7a7a7',
        },
        // Kids-friendly color palette (kept for backward compatibility)
        kids: {
          pink: '#ff6b9d',
          'pink-light': '#ff8fb3',
          turquoise: '#4ecdc4',
          'turquoise-light': '#6dd5d0',
          purple: '#fef7ff',
          white: '#ffffff',
          'text-dark': '#2d3748',
          'text-medium': '#4a5568',
          'text-light': '#a0aec0',
          border: '#e2e8f0',
        },
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB', // GuruKool primary blue
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#1E3A8A',
          900: '#1E3A8A',
          950: '#172554',
        },
        secondary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6', // GuruKool secondary teal
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium:
          '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        hard: '0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        stripes:
          'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)',
        'gurukool-gradient':
          'linear-gradient(135deg, #2563EB 0%, #14B8A6 50%, #F59E0B 100%)',
        'gurukool-hero':
          'linear-gradient(180deg, rgba(37,99,235,0.1) 0%, rgba(20,184,166,0.05) 100%)',
        'gurukool-card': 'linear-gradient(145deg, #FFFFFF 0%, #F9FAFB 100%)',
        'gurukool-overlay':
          'linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.8) 100%)',
        'gurukool-primary': 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        'gurukool-secondary':
          'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
        'netflix-gradient':
          'linear-gradient(135deg, #e50914 0%, #b81d13 50%, #000000 100%)',
        'netflix-hero':
          'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
        'netflix-card': 'linear-gradient(145deg, #141414 0%, #1a1a1a 100%)',
        'netflix-overlay':
          'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
        'amazon-gradient':
          'linear-gradient(135deg, #ff9900 0%, #ffb84d 50%, #ffffff 100%)',
        'amazon-hero':
          'linear-gradient(180deg, rgba(255,153,0,0.1) 0%, rgba(255,153,0,0.05) 100%)',
        'amazon-card': 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        'kids-gradient':
          'linear-gradient(135deg, #ff6b9d 0%, #4ecdc4 50%, #fef7ff 100%)',
        'kids-hero':
          'linear-gradient(180deg, rgba(255,107,157,0.1) 0%, rgba(78,205,196,0.1) 100%)',
        'kids-card': 'linear-gradient(145deg, #ffffff 0%, #fef7ff 100%)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
