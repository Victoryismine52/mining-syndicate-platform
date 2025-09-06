import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { ThemeMode, ThemeContextType } from '../types/theme';
import { themes, themeOrder } from '../styles/themes';

const THEME_STORAGE_KEY = 'mining-syndicate-theme';

export const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark',
  storageKey = THEME_STORAGE_KEY 
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'fu')) {
        setCurrentTheme(stored as ThemeMode);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, [storageKey]);

  // Apply theme to document root and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    const theme = themes[currentTheme];
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'fu');
    
    // Add current theme class
    root.classList.add(currentTheme);
    
    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Apply gradient custom properties
    if (theme.gradients) {
      Object.entries(theme.gradients).forEach(([key, value]) => {
        const cssVar = `--gradient-${key}`;
        root.style.setProperty(cssVar, value);
      });
    }

    // Apply effect custom properties
    if (theme.effects) {
      Object.entries(theme.effects).forEach(([key, value]) => {
        const cssVar = `--effect-${key}`;
        root.style.setProperty(cssVar, value);
      });
    }

    // Save to localStorage
    try {
      localStorage.setItem(storageKey, currentTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [currentTheme, storageKey]);

  const setTheme = (theme: ThemeMode) => {
    setCurrentTheme(theme);
  };

  const toggleTheme = () => {
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setCurrentTheme(themeOrder[nextIndex]);
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    themes,
    setTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    isFu: currentTheme === 'fu',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;