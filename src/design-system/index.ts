// Design System Foundation
export * from './tokens';
export * from './animations';
export * from './themes';
export * from './components';

// Liquid Glass Layout Components - Primary UI Components
export {
  LiquidLearningLayout,
  GlassCard,
  GlassHeader,
  GlassStatCard,
  LiquidButton,
  SectionTitle,
} from '@/components/layouts/LiquidLearningLayout';

// GuruKool Brand Theme Constants
export const GURUKOOL_THEME = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#3B82F6',
  secondary: '#14B8A6',
  secondaryDark: '#0D9488',
  secondaryLight: '#2DD4BF',
  accent: '#F59E0B',
  accentDark: '#D97706',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

// Gradient presets using GuruKool theme
export const GURUKOOL_GRADIENTS = {
  primary: 'from-gurukool-primary to-gurukool-primary-light',
  secondary: 'from-gurukool-secondary to-gurukool-secondary-light',
  brand: 'from-gurukool-primary via-gurukool-secondary to-gurukool-accent',
  hero: 'from-gurukool-primary to-gurukool-secondary',
  accent: 'from-gurukool-accent to-gurukool-accent-light',
} as const;
