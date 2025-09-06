import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeMode } from '../types/theme';

interface ThemeSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'pills' | 'icons';
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeSelector({ 
  className = '', 
  variant = 'pills',
  size = 'md' 
}: ThemeSelectorProps) {
  const { currentTheme, setTheme, themes } = useTheme();

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2', 
    lg: 'text-base px-4 py-3',
  };

  const themeIcons = {
    light: '☀️',
    dark: '🌙', 
    fu: '⚡',
  };

  const themeLabels = {
    light: 'Light',
    dark: 'Dark',
    fu: 'PitchMe',
  };

  if (variant === 'dropdown') {
    return (
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value as ThemeMode)}
        className={`
          bg-card border border-border rounded-md ${sizeClasses[size]}
          text-foreground focus:ring-2 focus:ring-ring focus:outline-none
          ${className}
        `}
      >
        {Object.entries(themes).map(([key, theme]) => (
          <option key={key} value={key}>
            {themeIcons[key as ThemeMode]} {theme.name}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'icons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => setTheme(key as ThemeMode)}
            className={`
              ${sizeClasses[size]} rounded-full transition-all duration-200
              ${currentTheme === key 
                ? 'bg-accent text-accent-foreground ring-2 ring-ring' 
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }
            `}
            title={theme.name}
          >
            {themeIcons[key as ThemeMode]}
          </button>
        ))}
      </div>
    );
  }

  // Default pills variant
  return (
    <div className={`flex items-center gap-1 p-1 bg-muted rounded-lg ${className}`}>
      {Object.entries(themes).map(([key, theme]) => (
        <button
          key={key}
          onClick={() => setTheme(key as ThemeMode)}
          className={`
            ${sizeClasses[size]} rounded-md transition-all duration-200 font-medium
            ${currentTheme === key 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
          `}
        >
          {themeIcons[key as ThemeMode]} {themeLabels[key as ThemeMode]}
        </button>
      ))}
    </div>
  );
}

export default ThemeSelector;