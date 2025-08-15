'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeConfig, ThemeName, themes } from './theme-config';

interface ThemeContextType {
  theme: ThemeName;
  themeConfig: ThemeConfig;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'gurukool-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as ThemeName;
      if (savedTheme && themes[savedTheme]) {
        setThemeState(savedTheme);
      } else {
        // Detect system preference
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        setThemeState(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      // Fallback to default theme if localStorage is not available (SSR)
      setThemeState(defaultTheme);
    }
    setMounted(true);
  }, [storageKey, defaultTheme]);

  // Update document class and localStorage when theme changes
  useEffect(() => {
    if (!mounted) {
      return;
    }

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Ignore localStorage errors during SSR
    }
  }, [theme, mounted, storageKey]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    themeConfig: themes[theme],
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={value}>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={`min-h-screen transition-colors duration-200 ${
            theme === 'dark'
              ? 'bg-slate-900 text-slate-100'
              : 'bg-white text-slate-900'
          }`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme toggle component
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-lg border border-neutral-200 dark:border-neutral-700
        bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700
        transition-colors duration-200 ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5"
        >
          {theme === 'light' ? (
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
