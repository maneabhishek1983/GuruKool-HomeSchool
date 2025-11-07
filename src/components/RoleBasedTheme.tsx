'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeConfig, ThemeName, themes } from '@/design-system/themes/theme-config';
import { useAuthContext } from '@/lib/authContext';
import { NetflixBackground, NetflixCard, NetflixButton } from './NetflixBackground';

interface RoleBasedThemeContextType {
  theme: ThemeName;
  themeConfig: ThemeConfig;
  isDark: boolean;
}

const RoleBasedThemeContext = createContext<RoleBasedThemeContextType | undefined>(undefined);

interface RoleBasedThemeProviderProps {
  children: React.ReactNode;
}

export function RoleBasedThemeProvider({ children }: RoleBasedThemeProviderProps) {
  const { user } = useAuthContext();
  const [theme, setTheme] = useState<ThemeName>('netflix');
  const [mounted, setMounted] = useState(false);

  // Determine theme based on user role
  useEffect(() => {
    if (user?.role) {
      switch (user.role) {
        case 'parent':
          setTheme('netflix');
          break;
        case 'teacher':
          setTheme('amazon');
          break;
        case 'student':
          setTheme('kids');
          break;
        default:
          setTheme('netflix');
      }
    }
    setMounted(true);
  }, [user?.role]);

  // Update document class when theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'netflix', 'amazon', 'kids');
    root.classList.add(theme);

    // Update body classes for theme-specific styling
    document.body.className = `theme-${theme}`;
  }, [theme, mounted]);

  const value: RoleBasedThemeContextType = {
    theme,
    themeConfig: themes[theme],
    isDark: theme === 'netflix' || theme === 'dark',
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <RoleBasedThemeContext.Provider value={value}>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`min-h-screen transition-colors duration-300 ${
            theme === 'netflix'
              ? 'bg-netflix-black text-white'
              : theme === 'amazon'
              ? 'bg-amazon-white text-amazon-blue'
              : theme === 'kids'
              ? 'bg-kids-purple text-kids-text-dark'
              : 'bg-white text-gray-900'
          }`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </RoleBasedThemeContext.Provider>
  );
}

export function useRoleBasedTheme() {
  const context = useContext(RoleBasedThemeContext);
  if (context === undefined) {
    throw new Error('useRoleBasedTheme must be used within a RoleBasedThemeProvider');
  }
  return context;
}

// Theme-specific background components
export function ThemeBackground({
  children,
  variant = 'hero',
  className = ''
}: {
  children: React.ReactNode;
  variant?: 'hero' | 'dashboard' | 'card' | 'minimal';
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const context = useContext(RoleBasedThemeContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context) {
    return <div className={className}>{children}</div>;
  }

  const { theme } = context;

  if (theme === 'netflix') {
    return <NetflixBackground variant={variant} className={className}>{children}</NetflixBackground>;
  }

  // For other themes, use a simple background for now
  return <div className={className}>{children}</div>;
}

// Theme-specific card components
export function ThemeCard({
  children,
  className = '',
  hover = true
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const context = useContext(RoleBasedThemeContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context) {
    return <div className={className}>{children}</div>;
  }

  const { theme } = context;

  if (theme === 'netflix') {
    return <NetflixCard className={className} hover={hover}>{children}</NetflixCard>;
  }

  // For other themes, use a simple card
  return <div className={className}>{children}</div>;
}

// Theme-specific button components
export function ThemeButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: any;
}) {
  const [mounted, setMounted] = useState(false);
  const context = useContext(RoleBasedThemeContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context) {
    return <button className={className} {...props}>{children}</button>;
  }

  const { theme } = context;

  if (theme === 'netflix') {
    return <NetflixButton variant={variant} size={size} className={className} {...props}>{children}</NetflixButton>;
  }

  // For other themes, use a simple button
  return <button className={className} {...props}>{children}</button>;
}
