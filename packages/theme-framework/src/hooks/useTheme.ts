import { useContext } from 'react';
import { ThemeContext } from '../components/ThemeProvider';
import { ThemeContextType } from '../types/theme';

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default useTheme;