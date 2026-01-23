// Glassmorphism & Liquid Learning Design Tokens
// Premium glass effects for the Liquid Learning aesthetic

export const glassmorphism = {
  // Blur values for backdrop-filter
  blur: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '40px',
  },

  // Glass background opacity values
  opacity: {
    subtle: 0.1,
    light: 0.15,
    medium: 0.2,
    strong: 0.3,
    heavy: 0.4,
  },

  // Glass backgrounds with RGBA values
  backgrounds: {
    // Light theme glass
    light: {
      subtle: 'rgba(255, 255, 255, 0.1)',
      standard: 'rgba(255, 255, 255, 0.15)',
      medium: 'rgba(255, 255, 255, 0.2)',
      strong: 'rgba(255, 255, 255, 0.3)',
      solid: 'rgba(255, 255, 255, 0.5)',
    },
    // Dark theme glass
    dark: {
      subtle: 'rgba(15, 23, 42, 0.1)',
      standard: 'rgba(15, 23, 42, 0.15)',
      medium: 'rgba(15, 23, 42, 0.2)',
      strong: 'rgba(15, 23, 42, 0.3)',
      solid: 'rgba(15, 23, 42, 0.5)',
    },
    // Colored glass effects
    primary: {
      subtle: 'rgba(14, 165, 233, 0.1)',
      standard: 'rgba(14, 165, 233, 0.15)',
      medium: 'rgba(14, 165, 233, 0.2)',
    },
    secondary: {
      subtle: 'rgba(217, 70, 239, 0.1)',
      standard: 'rgba(217, 70, 239, 0.15)',
      medium: 'rgba(217, 70, 239, 0.2)',
    },
    success: {
      subtle: 'rgba(34, 197, 94, 0.1)',
      standard: 'rgba(34, 197, 94, 0.15)',
      medium: 'rgba(34, 197, 94, 0.2)',
    },
    warning: {
      subtle: 'rgba(245, 158, 11, 0.1)',
      standard: 'rgba(245, 158, 11, 0.15)',
      medium: 'rgba(245, 158, 11, 0.2)',
    },
    error: {
      subtle: 'rgba(239, 68, 68, 0.1)',
      standard: 'rgba(239, 68, 68, 0.15)',
      medium: 'rgba(239, 68, 68, 0.2)',
    },
  },

  // Border colors for glass effect
  borders: {
    light: 'rgba(255, 255, 255, 0.2)',
    lightMedium: 'rgba(255, 255, 255, 0.3)',
    lightStrong: 'rgba(255, 255, 255, 0.4)',
    dark: 'rgba(0, 0, 0, 0.1)',
    darkMedium: 'rgba(0, 0, 0, 0.2)',
    darkStrong: 'rgba(0, 0, 0, 0.3)',
  },

  // Glass shadow effects (for floating glass cards)
  shadows: {
    glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
    glassLg: '0 16px 48px rgba(0, 0, 0, 0.15)',
    glassXl: '0 24px 64px rgba(0, 0, 0, 0.2)',
    glassPrimary: '0 8px 32px rgba(14, 165, 233, 0.15)',
    glassSecondary: '0 8px 32px rgba(217, 70, 239, 0.15)',
    innerGlow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  },
} as const;

// Liquid gradients for flowing backgrounds
export const liquidGradients = {
  // Animated background gradients
  flow: {
    primary: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #d946ef 100%)',
    sunset: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
    ocean: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
    forest: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #06b6d4 100%)',
    aurora:
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 25%, #06b6d4 50%, #22c55e 75%, #eab308 100%)',
  },

  // Mesh gradients for rich backgrounds
  mesh: {
    primary: `
      radial-gradient(at 40% 20%, rgba(14, 165, 233, 0.3) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.3) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(217, 70, 239, 0.3) 0px, transparent 50%),
      radial-gradient(at 80% 50%, rgba(14, 165, 233, 0.3) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(139, 92, 246, 0.3) 0px, transparent 50%)
    `,
    warm: `
      radial-gradient(at 40% 20%, rgba(245, 158, 11, 0.3) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(239, 68, 68, 0.3) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.3) 0px, transparent 50%)
    `,
    cool: `
      radial-gradient(at 40% 20%, rgba(6, 182, 212, 0.3) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.3) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(139, 92, 246, 0.3) 0px, transparent 50%)
    `,
  },

  // Shimmer gradients for loading states
  shimmer: {
    light:
      'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
    dark: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
  },
} as const;

// Pre-composed glass styles (Tailwind-compatible class strings)
export const glassStyles = {
  // Card variants
  card: {
    subtle: 'bg-white/10 backdrop-blur-sm border border-white/20',
    standard: 'bg-white/15 backdrop-blur-md border border-white/25 shadow-lg',
    frosted: 'bg-white/20 backdrop-blur-lg border border-white/30 shadow-xl',
    solid: 'bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl',
  },

  // Button variants
  button: {
    ghost:
      'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20',
    filled:
      'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30',
    solid:
      'bg-white/30 hover:bg-white/40 backdrop-blur-lg border border-white/40',
  },

  // Input variants
  input: {
    standard:
      'bg-white/10 backdrop-blur-sm border border-white/20 focus:border-white/40 focus:bg-white/15',
    filled:
      'bg-white/20 backdrop-blur-md border border-white/30 focus:border-white/50 focus:bg-white/25',
  },

  // Modal/overlay variants
  modal: {
    backdrop: 'bg-black/30 backdrop-blur-sm',
    content:
      'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl',
  },

  // Navigation variants
  nav: {
    floating:
      'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 shadow-lg',
    solid:
      'bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-white/20',
  },
} as const;

// Dark mode glass styles
export const glassStylesDark = {
  card: {
    subtle: 'bg-slate-900/10 backdrop-blur-sm border border-white/10',
    standard:
      'bg-slate-900/20 backdrop-blur-md border border-white/15 shadow-lg',
    frosted:
      'bg-slate-900/30 backdrop-blur-lg border border-white/20 shadow-xl',
    solid: 'bg-slate-900/40 backdrop-blur-xl border border-white/25 shadow-2xl',
  },

  button: {
    ghost:
      'bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10',
    filled:
      'bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15',
    solid:
      'bg-white/15 hover:bg-white/20 backdrop-blur-lg border border-white/20',
  },

  input: {
    standard:
      'bg-white/5 backdrop-blur-sm border border-white/10 focus:border-white/30 focus:bg-white/10',
    filled:
      'bg-white/10 backdrop-blur-md border border-white/15 focus:border-white/40 focus:bg-white/15',
  },
} as const;

// CSS Variables for glassmorphism (to be injected into :root)
export const glassCSSVariables = {
  light: {
    '--glass-bg': 'rgba(255, 255, 255, 0.15)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 0.25)',
    '--glass-border': 'rgba(255, 255, 255, 0.2)',
    '--glass-border-hover': 'rgba(255, 255, 255, 0.35)',
    '--glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
    '--glass-blur': '12px',
    '--glass-blur-lg': '24px',
    '--glass-text-primary': 'rgba(15, 23, 42, 0.9)',
    '--glass-text-secondary': 'rgba(15, 23, 42, 0.7)',
  },
  dark: {
    '--glass-bg': 'rgba(15, 23, 42, 0.2)',
    '--glass-bg-hover': 'rgba(15, 23, 42, 0.3)',
    '--glass-border': 'rgba(255, 255, 255, 0.1)',
    '--glass-border-hover': 'rgba(255, 255, 255, 0.2)',
    '--glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
    '--glass-blur': '12px',
    '--glass-blur-lg': '24px',
    '--glass-text-primary': 'rgba(241, 245, 249, 0.9)',
    '--glass-text-secondary': 'rgba(241, 245, 249, 0.7)',
  },
} as const;

export type GlassBlur = keyof typeof glassmorphism.blur;
export type GlassOpacity = keyof typeof glassmorphism.opacity;
export type GlassStyle = keyof typeof glassStyles.card;
