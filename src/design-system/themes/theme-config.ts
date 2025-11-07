// Theme Configuration
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
    shadow: string;
  };
  spacing: Record<string, string>;
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

// Light theme configuration
export const lightTheme: ThemeConfig = {
  colors: {
    primary: '#0ea5e9',
    secondary: '#d946ef',
    background: '#ffffff',
    surface: '#f8fafc',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#cbd5e1',
    },
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};

// Netflix-inspired dark theme configuration
export const darkTheme: ThemeConfig = {
  colors: {
    primary: '#e50914', // Netflix red
    secondary: '#ff6b6b', // Vibrant red accent
    background: '#000000', // Pure black like Netflix
    surface: '#141414', // Dark gray for cards
    text: {
      primary: '#ffffff', // Pure white text
      secondary: '#b3b3b3', // Light gray for secondary text
      disabled: '#666666', // Medium gray for disabled
    },
    border: '#333333', // Dark border
    shadow: 'rgba(0, 0, 0, 0.8)', // Strong black shadow
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    md: '0 4px 16px rgba(0, 0, 0, 0.5)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
    xl: '0 16px 64px rgba(0, 0, 0, 0.7)',
  },
};

// Netflix-inspired theme with gradients
export const netflixTheme: ThemeConfig = {
  colors: {
    primary: '#e50914', // Netflix red
    secondary: '#ff6b6b', // Vibrant red accent
    background: '#000000', // Pure black
    surface: '#141414', // Dark gray for cards
    text: {
      primary: '#ffffff', // Pure white text
      secondary: '#b3b3b3', // Light gray for secondary text
      disabled: '#666666', // Medium gray for disabled
    },
    border: '#333333', // Dark border
    shadow: 'rgba(0, 0, 0, 0.8)', // Strong black shadow
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    md: '0 4px 16px rgba(0, 0, 0, 0.5)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
    xl: '0 16px 64px rgba(0, 0, 0, 0.7)',
  },
};

// Amazon-inspired theme for teachers
export const amazonTheme: ThemeConfig = {
  colors: {
    primary: '#ff9900', // Amazon orange
    secondary: '#ffb84d', // Light orange
    background: '#ffffff', // Clean white
    surface: '#f8f9fa', // Light gray for cards
    text: {
      primary: '#232f3e', // Amazon dark blue
      secondary: '#565959', // Medium gray
      disabled: '#a7a7a7', // Light gray for disabled
    },
    border: '#d5d9d9', // Light border
    shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
};

// Kids-friendly theme for students
export const kidsTheme: ThemeConfig = {
  colors: {
    primary: '#ff6b9d', // Bright pink
    secondary: '#4ecdc4', // Turquoise
    background: '#fef7ff', // Light purple background
    surface: '#ffffff', // White cards
    text: {
      primary: '#2d3748', // Dark gray
      secondary: '#4a5568', // Medium gray
      disabled: '#a0aec0', // Light gray for disabled
    },
    border: '#e2e8f0', // Light border
    shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
};

// Theme variants
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  netflix: netflixTheme,
  amazon: amazonTheme,
  kids: kidsTheme,
} as const;

export type ThemeName = keyof typeof themes;